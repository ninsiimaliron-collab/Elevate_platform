const { verifyToken } = require('../config/jwt');
const { AuthError } = require('../utils/errors');

const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

const verifyAccessToken = (req, _res, next) => {
  try {
    const token = getBearerToken(req) || req.cookies?.accessToken;
    if (!token) {
      throw new AuthError('Access token required');
    }

    const payload = verifyToken(token, accessSecret);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

const verifyRefreshToken = (req, _res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      throw new AuthError('Refresh token required');
    }

    const payload = verifyToken(token, refreshSecret);
    req.refreshToken = token;
    req.refreshPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyAccessToken,
  verifyRefreshToken
};
