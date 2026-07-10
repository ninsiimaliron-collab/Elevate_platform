const jwt = require('jsonwebtoken');
const { AuthError } = require('../utils/errors');

const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const emailSecret = process.env.JWT_EMAIL_SECRET || accessSecret;

const signAccessToken = (payload) => {
  return jwt.sign(payload, accessSecret, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || '15m'
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, refreshSecret, {
    expiresIn: process.env.REFRESH_TOKEN_TTL || '7d'
  });
};

const signEmailToken = (payload) => {
  return jwt.sign(payload, emailSecret, {
    expiresIn: '24h'
  });
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (_error) {
    throw new AuthError('Invalid or expired token');
  }
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  signEmailToken,
  verifyToken
};
