const { query } = require('../../config/database');
const { paginate, slugify } = require('../../utils/helpers');
const { ForbiddenError, NotFoundError, ValidationError } = require('../../utils/errors');

const getEmployerProfile = async (userId) => {
  const res = await query('SELECT id, registration_status FROM employer_profiles WHERE user_id = ?', [userId]);
  if (res.rowCount === 0) {
    throw new NotFoundError('Employer profile not found');
  }
  return res.rows[0];
};

const ensureOwnJob = async (jobId, userId, adminOverride = false) => {
  const res = await query(
    `SELECT j.*, ep.user_id
     FROM jobs j
     JOIN employer_profiles ep ON ep.id = j.employer_id
     WHERE j.id = ? OR j.slug = ?`,
    [jobId, jobId]
  );

  if (res.rowCount === 0) {
    throw new NotFoundError('Job not found');
  }

  if (!adminOverride && res.rows[0].user_id !== userId) {
    throw new ForbiddenError('You do not own this job');
  }

  return res.rows[0];
};

const expireJobs = async () => {
  await query(
    `UPDATE jobs
     SET status = 'expired', updated_at = NOW()
     WHERE status = 'active' AND application_deadline IS NOT NULL AND application_deadline < CURRENT_DATE`
  );
};

const createJob = async (userId, payload) => {
  const employer = await getEmployerProfile(userId);
  const slugBase = slugify(payload.title || 'job');
  const slug = `${slugBase}-${Date.now()}`;

  const res = await query(
    `INSERT INTO jobs (
      employer_id, title, slug, description, requirements, responsibilities, job_type, division,
      location_detail, skills_required, education_level, experience_years, salary_min, salary_max,
      salary_currency, is_salary_visible, application_deadline, status
    ) VALUES (
      ?, ?, ?, ?, COALESCE(?, JSON_ARRAY()), COALESCE(?, JSON_ARRAY()), ?, ?,
      ?, COALESCE(?, JSON_ARRAY()), ?, ?, ?, ?, COALESCE(?, 'UGX'), COALESCE(?, false), ?, 'draft'
    )`,
    [
      employer.id,
      payload.title,
      slug,
      payload.description,
      payload.requirements ? JSON.stringify(payload.requirements) : null,
      payload.responsibilities ? JSON.stringify(payload.responsibilities) : null,
      payload.job_type,
      payload.division,
      payload.location_detail,
      payload.skills_required ? JSON.stringify(payload.skills_required) : null,
      payload.education_level,
      payload.experience_years,
      payload.salary_min,
      payload.salary_max,
      payload.salary_currency,
      payload.is_salary_visible,
      payload.application_deadline
    ]
  );

  const created = await query('SELECT * FROM jobs WHERE slug = ? LIMIT 1', [slug]);
  return created.rows[0];
};

const updateJob = async (jobId, userId, payload) => {
  const job = await ensureOwnJob(jobId, userId);
  if (job.status === 'closed' || job.status === 'expired') {
    throw new ForbiddenError('Cannot edit a closed or expired job');
  }

  const result = await query(
    `UPDATE jobs
     SET title = COALESCE(?, title),
       description = COALESCE(?, description),
       requirements = COALESCE(?, requirements),
       responsibilities = COALESCE(?, responsibilities),
       job_type = COALESCE(?, job_type),
       division = COALESCE(?, division),
       location_detail = COALESCE(?, location_detail),
       skills_required = COALESCE(?, skills_required),
       education_level = COALESCE(?, education_level),
       experience_years = COALESCE(?, experience_years),
       salary_min = COALESCE(?, salary_min),
       salary_max = COALESCE(?, salary_max),
       salary_currency = COALESCE(?, salary_currency),
       is_salary_visible = COALESCE(?, is_salary_visible),
       application_deadline = COALESCE(?, application_deadline),
         updated_at = NOW()
     WHERE id = ?`,
    [
      payload.title,
      payload.description,
      payload.requirements ? JSON.stringify(payload.requirements) : null,
      payload.responsibilities ? JSON.stringify(payload.responsibilities) : null,
      payload.job_type,
      payload.division,
      payload.location_detail,
      payload.skills_required ? JSON.stringify(payload.skills_required) : null,
      payload.education_level,
      payload.experience_years,
      payload.salary_min,
      payload.salary_max,
      payload.salary_currency,
      payload.is_salary_visible,
      payload.application_deadline,
      job.id
    ]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Job not found');
  }

  const updated = await query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [job.id]);
  return updated.rows[0];
};

const publishJob = async (jobId, userId) => {
  const employer = await getEmployerProfile(userId);
  if (employer.registration_status !== 'verified') {
    throw new ForbiddenError('Only verified employers can publish jobs');
  }

  const job = await ensureOwnJob(jobId, userId);
  const requiredFields = [job.title, job.description, job.job_type, job.division, job.application_deadline];
  if (requiredFields.some((f) => !f)) {
    throw new ValidationError('Fill all required fields before publishing');
  }

  await query("UPDATE jobs SET status = 'active', updated_at = NOW() WHERE id = ?", [job.id]);
  const res = await query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [job.id]);
  return res.rows[0];
};

const closeJob = async (jobId, userId) => {
  const job = await ensureOwnJob(jobId, userId);
  await query("UPDATE jobs SET status = 'closed', updated_at = NOW() WHERE id = ?", [job.id]);
  const res = await query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [job.id]);
  return res.rows[0];
};

const softDeleteJob = async (jobId, userId, isAdmin) => {
  const job = await ensureOwnJob(jobId, userId, isAdmin);
  await query("UPDATE jobs SET status = 'archived', updated_at = NOW() WHERE id = ?", [job.id]);
  const res = await query('SELECT * FROM jobs WHERE id = ? LIMIT 1', [job.id]);
  return res.rows[0];
};

const listJobs = async (filters) => {
  await expireJobs();
  const { page, limit, offset } = paginate(filters);
  const where = [];
  const values = [];

  if (filters.status) {
    values.push(filters.status);
    where.push('j.status = ?');
  } else {
    values.push('active');
    where.push('j.status = ?');
  }

  if (filters.division) {
    values.push(filters.division);
    where.push('j.division = ?');
  }

  if (filters.job_type) {
    values.push(filters.job_type);
    where.push('j.job_type = ?');
  }

  if (filters.education_level) {
    values.push(filters.education_level);
    where.push('j.education_level = ?');
  }

  if (filters.skills) {
    const skills = filters.skills
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (skills.length) {
      const skillPredicates = skills.map(() => 'JSON_SEARCH(j.skills_required, "one", ?) IS NOT NULL');
      where.push(`(${skillPredicates.join(' OR ')})`);
      values.push(...skills);
    }
  }

  if (filters.keyword) {
    values.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    where.push('(j.title LIKE ? OR j.description LIKE ?)');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  values.push(limit, offset);

  const listRes = await query(
    `SELECT j.*, ep.company_name, ep.logo_url
     FROM jobs j
     JOIN employer_profiles ep ON ep.id = j.employer_id
     ${whereClause}
     ORDER BY j.created_at DESC
     LIMIT ? OFFSET ?`,
    values
  );

  const ids = listRes.rows.map((r) => r.id);
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(', ');
    await query(`UPDATE jobs SET views_count = views_count + 1 WHERE id IN (${placeholders})`, ids);
  }

  const countRes = await query(`SELECT COUNT(*) AS total FROM jobs j ${whereClause}`, values.slice(0, values.length - 2));
  const total = Number(countRes.rows[0].total || 0);

  const data = listRes.rows.map((job) => {
    if (!job.is_salary_visible) {
      return { ...job, salary_min: null, salary_max: null };
    }
    return job;
  });

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
};

const getJob = async (idOrSlug) => {
  await expireJobs();
  const res = await query(
    `SELECT j.*, ep.company_name, ep.logo_url, ep.location_division
     FROM jobs j
     JOIN employer_profiles ep ON ep.id = j.employer_id
     WHERE j.id = ? OR j.slug = ?
     LIMIT 1`,
    [idOrSlug, idOrSlug]
  );

  if (res.rowCount === 0) {
    throw new NotFoundError('Job not found');
  }

  await query('UPDATE jobs SET views_count = views_count + 1 WHERE id = ?', [res.rows[0].id]);

  if (!res.rows[0].is_salary_visible) {
    res.rows[0].salary_min = null;
    res.rows[0].salary_max = null;
  }

  return res.rows[0];
};

const myListings = async (userId) => {
  const employer = await getEmployerProfile(userId);
  const res = await query(
    `SELECT j.*, COUNT(a.id) AS application_count
     FROM jobs j
     LEFT JOIN applications a ON a.job_id = j.id
     WHERE j.employer_id = ?
     GROUP BY j.id
     ORDER BY j.created_at DESC`,
    [employer.id]
  );

  return res.rows;
};

const adminAllJobs = async (filters) => {
  const { page, limit, offset } = paginate(filters);
  const rows = await query('SELECT * FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
  const count = await query('SELECT COUNT(*) AS total FROM jobs');
  const total = Number(count.rows[0].total || 0);
  return {
    data: rows.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
};

module.exports = {
  createJob,
  updateJob,
  publishJob,
  closeJob,
  softDeleteJob,
  listJobs,
  getJob,
  myListings,
  adminAllJobs
};
