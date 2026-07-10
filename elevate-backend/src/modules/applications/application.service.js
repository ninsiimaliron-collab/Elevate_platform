const { query } = require('../../config/database');
const { paginate } = require('../../utils/helpers');
const { sendApplicationUpdate } = require('../../utils/email');
const { ConflictError, ForbiddenError, NotFoundError, ValidationError } = require('../../utils/errors');

const getYouthProfile = async (userId) => {
  const res = await query('SELECT id, profile_complete FROM youth_profiles WHERE user_id = ?', [userId]);
  if (res.rowCount === 0) {
    throw new NotFoundError('Youth profile not found');
  }
  return res.rows[0];
};

const getEmployerProfile = async (userId) => {
  const res = await query('SELECT id FROM employer_profiles WHERE user_id = ?', [userId]);
  if (res.rowCount === 0) {
    throw new NotFoundError('Employer profile not found');
  }
  return res.rows[0];
};

const apply = async (jobId, userId, coverLetter) => {
  const youth = await getYouthProfile(userId);

  const jobRes = await query('SELECT id, status FROM jobs WHERE id = ? OR slug = ? LIMIT 1', [jobId, jobId]);
  if (jobRes.rowCount === 0) {
    throw new NotFoundError('Job not found');
  }

  if (jobRes.rows[0].status !== 'active') {
    throw new ForbiddenError('Only active jobs accept applications');
  }

  const dup = await query('SELECT id FROM applications WHERE job_id = ? AND youth_id = ?', [jobRes.rows[0].id, youth.id]);
  if (dup.rowCount > 0) {
    throw new ConflictError('You already applied to this job');
  }

  const res = await query(
    'INSERT INTO applications (job_id, youth_id, cover_letter, status) VALUES (?, ?, ?, ?)',
    [jobRes.rows[0].id, youth.id, coverLetter || null, 'pending']
  );

  if (res.rowCount === 0) {
    throw new ValidationError('Failed to create application');
  }

  const created = await query(
    'SELECT * FROM applications WHERE job_id = ? AND youth_id = ? ORDER BY applied_at DESC LIMIT 1',
    [jobRes.rows[0].id, youth.id]
  );
  return created.rows[0];
};

const myApplications = async (userId, filters) => {
  const youth = await getYouthProfile(userId);
  const { page, limit, offset } = paginate(filters);
  const values = [youth.id];
  let where = 'WHERE a.youth_id = ?';

  if (filters.status) {
    values.push(filters.status);
    where += ' AND a.status = ?';
  }

  values.push(limit, offset);

  const res = await query(
    `SELECT a.*, j.title AS job_title, j.slug AS job_slug, ep.company_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN employer_profiles ep ON ep.id = j.employer_id
     ${where}
     ORDER BY a.applied_at DESC
      LIMIT ? OFFSET ?`,
    values
  );

    const countRes = await query(`SELECT COUNT(*) AS total FROM applications a ${where}`, values.slice(0, values.length - 2));
    const total = Number(countRes.rows[0].total || 0);

  return {
    data: res.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
};

const jobApplicants = async (jobId, employerUserId) => {
  const employer = await getEmployerProfile(employerUserId);
  const jobRes = await query('SELECT id FROM jobs WHERE (id = ? OR slug = ?) AND employer_id = ?', [jobId, jobId, employer.id]);
  if (jobRes.rowCount === 0) {
    throw new ForbiddenError('Job not found or not owned by employer');
  }

  const res = await query(
    `SELECT a.id, a.status, a.cover_letter, a.applied_at,
            yp.id AS youth_id, yp.full_name, yp.skills, yp.education_level, yp.cv_url,
            CASE WHEN a.status IN ('shortlisted', 'accepted') THEN u.email ELSE NULL END AS email,
            CASE WHEN a.status IN ('shortlisted', 'accepted') THEN u.phone ELSE NULL END AS phone
     FROM applications a
     JOIN youth_profiles yp ON yp.id = a.youth_id
     JOIN users u ON u.id = yp.user_id
     WHERE a.job_id = ?
     ORDER BY a.applied_at DESC`,
    [jobRes.rows[0].id]
  );

  return res.rows;
};

const updateApplicationStatus = async (applicationId, employerUserId, status) => {
  const employer = await getEmployerProfile(employerUserId);
  const res = await query(
    `SELECT a.id, a.status, a.youth_id, j.id AS job_id, j.title, j.employer_id
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.id = ?`,
    [applicationId]
  );

  if (res.rowCount === 0) {
    throw new NotFoundError('Application not found');
  }

  const app = res.rows[0];
  if (app.employer_id !== employer.id) {
    throw new ForbiddenError('Not authorized to update this application');
  }

  if (app.status === 'withdrawn') {
    throw new ValidationError('Cannot update a withdrawn application');
  }

  const validTransitions = {
    pending: ['under_review', 'shortlisted', 'accepted', 'rejected'],
    under_review: ['shortlisted', 'accepted', 'rejected'],
    shortlisted: ['accepted', 'rejected'],
    accepted: [],
    rejected: [],
    withdrawn: []
  };

  if (!validTransitions[app.status]?.includes(status)) {
    throw new ValidationError('Invalid application status transition');
  }

  await query('UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?', [
    status,
    applicationId
  ]);

  if (status === 'accepted' || status === 'rejected') {
    const youthEmailRes = await query(
      `SELECT u.email
       FROM youth_profiles yp
       JOIN users u ON u.id = yp.user_id
       WHERE yp.id = ?`,
      [app.youth_id]
    );
    if (youthEmailRes.rowCount > 0) {
      await sendApplicationUpdate(youthEmailRes.rows[0].email, app.title, status);
    }
  }

  const updateRes = await query('SELECT * FROM applications WHERE id = ? LIMIT 1', [applicationId]);
  return updateRes.rows[0];
};

const withdraw = async (applicationId, youthUserId) => {
  const youth = await getYouthProfile(youthUserId);
  const res = await query('SELECT id, status FROM applications WHERE id = ? AND youth_id = ?', [applicationId, youth.id]);
  if (res.rowCount === 0) {
    throw new NotFoundError('Application not found');
  }

  if (res.rows[0].status !== 'pending') {
    throw new ForbiddenError('You can only withdraw pending applications');
  }

  await query("UPDATE applications SET status = 'withdrawn', updated_at = NOW() WHERE id = ?", [applicationId]);
  const updateRes = await query('SELECT * FROM applications WHERE id = ? LIMIT 1', [applicationId]);
  return updateRes.rows[0];
};

const adminAll = async (filters) => {
  const { page, limit, offset } = paginate(filters);
  const dataRes = await query(
    `SELECT a.*, j.title AS job_title, yp.full_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN youth_profiles yp ON yp.id = a.youth_id
     ORDER BY a.applied_at DESC
      LIMIT ? OFFSET ?`,
    [limit, offset]
  );

    const countRes = await query('SELECT COUNT(*) AS total FROM applications');
    const total = Number(countRes.rows[0].total || 0);

  return {
    data: dataRes.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
};

module.exports = {
  apply,
  myApplications,
  jobApplicants,
  updateApplicationStatus,
  withdraw,
  adminAll
};
