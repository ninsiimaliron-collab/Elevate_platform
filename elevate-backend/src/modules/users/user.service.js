const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { query } = require('../../config/database');
const { paginate, calcAge } = require('../../utils/helpers');
const { ForbiddenError, NotFoundError, ValidationError } = require('../../utils/errors');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const detectMimeFromBuffer = (buffer, originalName = '') => {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // PDF: 25 50 44 46 (%PDF)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { mime: 'application/pdf', ext: 'pdf' };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  // ZIP container. DOCX files are zipped Office XML packages.
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    const lowerName = String(originalName || '').toLowerCase();
    if (lowerName.endsWith('.docx')) {
      return {
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ext: 'docx'
      };
    }
  }

  return null;
};

const detectAndSave = async (file, allowedMime, subfolder) => {
  if (!file || !file.buffer) {
    throw new ValidationError('File is required');
  }

  const detected = detectMimeFromBuffer(file.buffer, file.originalname);
  if (!detected || !allowedMime.includes(detected.mime)) {
    throw new ValidationError('Invalid file type');
  }

  const folder = path.join(uploadDir, subfolder);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const ext = detected.ext;
  const name = `${uuidv4()}.${ext}`;
  const absolute = path.join(folder, name);
  fs.writeFileSync(absolute, file.buffer);

  return `/uploads/${subfolder}/${name}`;
};

const getMe = async (userId) => {
  const userRes = await query(
    'SELECT id, email, phone, role, is_verified, is_active, last_login, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );
  if (userRes.rowCount === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userRes.rows[0];
  let profile = null;

  if (user.role === 'youth') {
    const p = await query('SELECT * FROM youth_profiles WHERE user_id = ?', [userId]);
    profile = p.rows[0] || null;
  }

  if (user.role === 'employer') {
    const p = await query('SELECT * FROM employer_profiles WHERE user_id = ?', [userId]);
    profile = p.rows[0] || null;
  }

  return { user, profile };
};

const updateYouthProfile = async (userId, payload) => {
  const profileRes = await query('SELECT id, date_of_birth FROM youth_profiles WHERE user_id = ?', [userId]);
  if (profileRes.rowCount === 0) {
    throw new NotFoundError('Youth profile not found');
  }

  const existing = profileRes.rows[0];
  const dob = payload.date_of_birth || existing.date_of_birth;
  const age = calcAge(dob);
  if (age < 18 || age > 30) {
    throw new ValidationError('Youth age must be between 18 and 30');
  }

  await query(
    `UPDATE youth_profiles
     SET full_name = COALESCE(?, full_name),
         date_of_birth = ?,
         age = ?,
         gender = COALESCE(?, gender),
         division = COALESCE(?, division),
         sub_county = COALESCE(?, sub_county),
         skills = COALESCE(?, skills),
         education_level = COALESCE(?, education_level),
         education_details = COALESCE(?, education_details),
         bio = COALESCE(?, bio),
         profile_complete = COALESCE(?, profile_complete),
         updated_at = NOW()
     WHERE user_id = ?`,
    [
      payload.full_name,
      dob,
      age,
      payload.gender,
      payload.division,
      payload.sub_county,
      payload.skills ? JSON.stringify(payload.skills) : null,
      payload.education_level,
      payload.education_details ? JSON.stringify(payload.education_details) : null,
      payload.bio,
      payload.profile_complete,
      userId
    ]
  );

  return getMe(userId);
};

const updateEmployerProfile = async (userId, payload) => {
  const profileRes = await query('SELECT id FROM employer_profiles WHERE user_id = ?', [userId]);
  if (profileRes.rowCount === 0) {
    throw new NotFoundError('Employer profile not found');
  }

  await query(
    `UPDATE employer_profiles
     SET company_name = COALESCE(?, company_name),
         industry = COALESCE(?, industry),
         registration_number = COALESCE(?, registration_number),
         location_division = COALESCE(?, location_division),
         address = COALESCE(?, address),
         website = COALESCE(?, website),
         description = COALESCE(?, description),
         contact_person = COALESCE(?, contact_person),
         updated_at = NOW()
     WHERE user_id = ?`,
    [
      payload.company_name,
      payload.industry,
      payload.registration_number,
      payload.location_division,
      payload.address,
      payload.website,
      payload.description,
      payload.contact_person,
      userId
    ]
  );

  return getMe(userId);
};

const uploadYouthCv = async (userId, file) => {
  const pathUrl = await detectAndSave(file, ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], 'cv');
  await query('UPDATE youth_profiles SET cv_url = ?, updated_at = NOW() WHERE user_id = ?', [pathUrl, userId]);
  return { cvUrl: pathUrl };
};

const uploadYouthPortfolio = async (userId, file) => {
  const pathUrl = await detectAndSave(file, ['image/png', 'image/jpeg', 'image/webp'], 'portfolio');
  await query('UPDATE youth_profiles SET portfolio_url = ?, updated_at = NOW() WHERE user_id = ?', [pathUrl, userId]);
  return { portfolioUrl: pathUrl };
};

const uploadEmployerLogo = async (userId, file) => {
  const pathUrl = await detectAndSave(file, ['image/png', 'image/jpeg', 'image/webp'], 'logos');
  await query('UPDATE employer_profiles SET logo_url = ?, updated_at = NOW() WHERE user_id = ?', [pathUrl, userId]);
  return { logoUrl: pathUrl };
};

const getPublicYouthProfile = async (id) => {
  const res = await query(
    `SELECT yp.id, yp.full_name, yp.gender, yp.division, yp.sub_county, yp.skills, yp.education_level, yp.bio, yp.portfolio_url
     FROM youth_profiles yp WHERE yp.id = ?`,
    [id]
  );

  if (res.rowCount === 0) {
    throw new NotFoundError('Youth profile not found');
  }

  return res.rows[0];
};

const listUsers = async (filters) => {
  const { page, limit, offset } = paginate(filters);
  const where = [];
  const values = [];

  if (filters.role) {
    values.push(filters.role);
    where.push('u.role = ?');
  }

  if (filters.is_active !== undefined) {
    values.push(filters.is_active === 'true');
    where.push('u.is_active = ?');
  }

  if (filters.division) {
    values.push(filters.division);
    where.push('(yp.division = ? OR ep.location_division = ?)');
    values.push(filters.division);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  values.push(limit, offset);

  const dataRes = await query(
    `SELECT u.id, u.email, u.phone, u.role, u.is_verified, u.is_active, u.created_at,
            yp.division AS youth_division, ep.location_division AS employer_division
     FROM users u
     LEFT JOIN youth_profiles yp ON yp.user_id = u.id
     LEFT JOIN employer_profiles ep ON ep.user_id = u.id
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    values
  );

  const countValues = values.slice(0, values.length - 2);
  const countRes = await query(
    `SELECT COUNT(*) AS total
     FROM users u
     LEFT JOIN youth_profiles yp ON yp.user_id = u.id
     LEFT JOIN employer_profiles ep ON ep.user_id = u.id
     ${whereClause}`,
    countValues
  );

  const total = Number(countRes.rows[0].total || 0);
  return {
    data: dataRes.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
};

const setUserStatus = async (id, isActive) => {
  const result = await query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [
    isActive,
    id
  ]);

  if (result.rowCount === 0) {
    throw new NotFoundError('User not found');
  }

  const row = await query('SELECT id, is_active FROM users WHERE id = ? LIMIT 1', [id]);
  return row.rows[0];
};

const verifyEmployer = async (userId, registrationStatus) => {
  const result = await query(
    `UPDATE employer_profiles
     SET registration_status = ?,
         verified_at = CASE WHEN ? = 'verified' THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE user_id = ?`,
    [registrationStatus, registrationStatus, userId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Employer profile not found');
  }

  const row = await query('SELECT user_id, registration_status FROM employer_profiles WHERE user_id = ? LIMIT 1', [userId]);
  return row.rows[0];
};

const ensureUserRole = async (userId, role) => {
  const res = await query('SELECT role FROM users WHERE id = ?', [userId]);
  if (res.rowCount === 0 || res.rows[0].role !== role) {
    throw new ForbiddenError('Role mismatch');
  }
};

module.exports = {
  getMe,
  updateYouthProfile,
  uploadYouthCv,
  uploadYouthPortfolio,
  updateEmployerProfile,
  uploadEmployerLogo,
  getPublicYouthProfile,
  listUsers,
  setUserStatus,
  verifyEmployer,
  ensureUserRole
};
