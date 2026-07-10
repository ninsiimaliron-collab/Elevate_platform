const rateLimit = require('express-rate-limit');

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isProduction = process.env.NODE_ENV === 'production';

const generalWindowMs = toInt(process.env.GENERAL_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const generalMax = toInt(process.env.GENERAL_RATE_LIMIT_MAX, isProduction ? 100 : 1000);

const authWindowMs = toInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, isProduction ? 15 * 60 * 1000 : 60 * 1000);
const authMax = toInt(process.env.AUTH_RATE_LIMIT_MAX, isProduction ? 20 : 100);

const generalLimiter = rateLimit({
  windowMs: generalWindowMs,
  max: generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests',
    errors: []
  }
});

const authLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait before trying again.',
    errors: []
  }
});

module.exports = {
  generalLimiter,
  authLimiter
};
