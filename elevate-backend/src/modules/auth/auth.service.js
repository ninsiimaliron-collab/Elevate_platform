const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const { getConnection, query } = require('../../config/database');
const { signAccessToken, signRefreshToken } = require('../../config/jwt');
const { sendPasswordReset, sendWelcomeEmail } = require('../../utils/email');
const { calcAge, sanitizePhone } = require('../../utils/helpers');
const { AuthError, ConflictError, NotFoundError, ValidationError } = require('../../utils/errors');

const rounds = Number(process.env.BCRYPT_ROUNDS || 12);

const createTokenPair = async (userId, role) => {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken({ sub: userId, role });

  const tokenHash = await bcrypt.hash(refreshToken, rounds);
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), false)',
    [userId, tokenHash]
  );

  return { accessToken, refreshToken };
};

const register = async (payload) => {
  const client = await getConnection();

  try {
    await client.beginTransaction();

    const email = payload.email.toLowerCase().trim();
    const phone = sanitizePhone(payload.phone);

    const [exists] = await client.query('SELECT id FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (exists.length > 0) {
      throw new ConflictError('Email or phone already in use');
    }

    // For employers, use default password "12345678"; for youth, use provided password
    const passwordToHash = payload.role === 'employer' ? '12345678' : payload.password;
    const passwordHash = await bcrypt.hash(passwordToHash, rounds);
    await client.query(
      'INSERT INTO users (email, phone, password_hash, role, is_verified, password_changed_at) VALUES (?, ?, ?, ?, false, ?)',
      [email, phone, passwordHash, payload.role, payload.role === 'employer' ? null : new Date()]
    );

    const [userRows] = await client.query('SELECT id, role, email FROM users WHERE email = ? LIMIT 1', [email]);
    const user = userRows[0];

    if (payload.role === 'youth') {
      const age = calcAge(payload.date_of_birth);
      if (age < 18 || age > 30) {
        throw new ValidationError('Youth age must be between 18 and 30');
      }
      await client.query(
        `INSERT INTO youth_profiles (user_id, full_name, date_of_birth, age, profile_complete)
         VALUES (?, ?, ?, ?, false)`,
        [user.id, payload.full_name || null, payload.date_of_birth, age]
      );
    }

    if (payload.role === 'employer') {
      await client.query(
        `INSERT INTO employer_profiles (user_id, company_name, industry, registration_status)
         VALUES (?, ?, ?, 'pending')`,
        [user.id, payload.company_name, payload.industry]
      );
    }

    await client.commit();

    const { accessToken, refreshToken } = await createTokenPair(user.id, user.role);
    await sendWelcomeEmail(user.email, payload.full_name || payload.company_name || 'there');

    return { user, accessToken, refreshToken };
  } catch (error) {
    await client.rollback();
    throw error;
  } finally {
    client.release();
  }
};

const login = async ({ email, password }) => {
  const userRes = await query(
    'SELECT id, email, role, password_hash, is_active, password_changed_at FROM users WHERE email = ? LIMIT 1',
    [email.toLowerCase().trim()]
  );

  if (userRes.rowCount === 0) {
    throw new AuthError('Invalid credentials');
  }

  const user = userRes.rows[0];
  if (!user.is_active) {
    throw new AuthError('Account is deactivated');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new AuthError('Invalid credentials');
  }

  await query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = ?', [user.id]);

  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role);
  const passwordResetRequired = user.role === 'employer' && !user.password_changed_at;
  return { user, accessToken, refreshToken, passwordResetRequired };
};

const refreshToken = async (token, payload) => {
  const tokenRows = await query(
    'SELECT id, token_hash FROM refresh_tokens WHERE user_id = ? AND revoked = false AND expires_at > NOW()',
    [payload.sub]
  );

  const matched = await Promise.all(
    tokenRows.rows.map(async (row) => ({ row, ok: await bcrypt.compare(token, row.token_hash) }))
  );

  const hit = matched.find((item) => item.ok);
  if (!hit) {
    throw new AuthError('Refresh token invalid or revoked');
  }

  await query('UPDATE refresh_tokens SET revoked = true WHERE id = ?', [hit.row.id]);

  const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
  const newRefreshToken = signRefreshToken({ sub: payload.sub, role: payload.role });
  const newHash = await bcrypt.hash(newRefreshToken, rounds);

  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), false)',
    [payload.sub, newHash]
  );

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId, token) => {
  const rows = await query('SELECT id, token_hash FROM refresh_tokens WHERE user_id = ? AND revoked = false', [userId]);
  for (const row of rows.rows) {
    const ok = await bcrypt.compare(token, row.token_hash);
    if (ok) {
      await query('UPDATE refresh_tokens SET revoked = true WHERE id = ?', [row.id]);
      return;
    }
  }
};

const forgotPassword = async (email) => {
  const userRes = await query('SELECT id, email FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
  if (userRes.rowCount === 0) {
    return;
  }

  const user = userRes.rows[0];
  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(raw, rounds);

  await query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), false)',
    [user.id, tokenHash]
  );

  const link = `${process.env.APP_BASE_URL || 'http://localhost:5000'}/reset-password?token=${raw}&email=${encodeURIComponent(user.email)}`;
  await sendPasswordReset(user.email, link);
};

const resetPassword = async ({ email, token, newPassword }) => {
  const userRes = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
  if (userRes.rowCount === 0) {
    throw new NotFoundError('Invalid reset request');
  }

  const userId = userRes.rows[0].id;
  const resetRows = await query(
    'SELECT id, token_hash FROM password_reset_tokens WHERE user_id = ? AND used = false AND expires_at > NOW()',
    [userId]
  );

  let matchedTokenId = null;
  for (const row of resetRows.rows) {
    // Compare submitted raw token against stored hash.
    const ok = await bcrypt.compare(token, row.token_hash);
    if (ok) {
      matchedTokenId = row.id;
      break;
    }
  }

  if (!matchedTokenId) {
    throw new AuthError('Reset token is invalid or expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, rounds);
  await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, userId]);
  await query('UPDATE password_reset_tokens SET used = true WHERE id = ?', [matchedTokenId]);
  await query('UPDATE refresh_tokens SET revoked = true WHERE user_id = ?', [userId]);
};

const verifyAccount = async (userId, password) => {
  const userRes = await query('SELECT id, email, role, is_verified, password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
  if (userRes.rowCount === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userRes.rows[0];
  if (user.role !== 'youth') {
    throw new ValidationError('Only job seeker accounts use this verification flow');
  }

  if (user.is_verified) {
    return {
      user: { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified },
      alreadyVerified: true
    };
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new AuthError('Activation code is invalid');
  }

  await query('UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = ?', [userId]);

  return {
    user: { id: user.id, email: user.email, role: user.role, is_verified: true },
    alreadyVerified: false
  };
};

const changePassword = async (userId, newPassword) => {
  const passwordHash = await bcrypt.hash(newPassword, rounds);
  await query('UPDATE users SET password_hash = ?, password_changed_at = NOW(), updated_at = NOW() WHERE id = ?', [
    passwordHash,
    userId
  ]);
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyAccount,
  changePassword
};
