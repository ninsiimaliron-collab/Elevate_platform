const { body } = require('express-validator');
const { PASSWORD_REGEX, UGANDA_PHONE_REGEX } = require('../../config/constants');
const { calcAge, sanitizePhone } = require('../../utils/helpers');

const registerValidation = [
  body('email').trim().isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('phone')
    .trim()
    .customSanitizer((value) => sanitizePhone(value))
    .matches(UGANDA_PHONE_REGEX)
    .withMessage('Must be a valid Ugandan phone number (+256 or 07XX format)'),
  body('password').custom((value, { req }) => {
    // Password is required for youth, but not for employers (they get default)
    if (req.body.role === 'youth') {
      if (!value || typeof value !== 'string') {
        throw new Error('Password is required');
      }
      if (!value.match(PASSWORD_REGEX)) {
        throw new Error('Password must be at least 8 chars and include uppercase, lowercase, number and special char');
      }
    }
    return true;
  }),
  body('role').trim().isIn(['youth', 'employer']).withMessage('Role must be youth or employer'),
  body('date_of_birth').custom((value, { req }) => {
    if (req.body.role !== 'youth') {
      return true;
    }
    if (!value || Number.isNaN(new Date(value).getTime())) {
      throw new Error('date_of_birth is required for youth');
    }
    const age = calcAge(value);
    if (age < 18 || age > 30) {
      throw new Error('Youth age must be between 18 and 30');
    }
    return true;
  }),
  body('company_name').custom((value, { req }) => {
    if (req.body.role !== 'employer') {
      return true;
    }
    if (!value || String(value).trim().length === 0) {
      throw new Error('company_name is required for employer');
    }
    return true;
  }),
  body('industry').custom((value, { req }) => {
    if (req.body.role !== 'employer') {
      return true;
    }
    if (!value) {
      throw new Error('industry is required for employer');
    }
    return true;
  })
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .matches(PASSWORD_REGEX)
    .withMessage('Password must be at least 8 chars and include uppercase, lowercase, number and special char')
];

const changePasswordValidation = [
  body('newPassword')
    .matches(PASSWORD_REGEX)
    .withMessage('Password must be at least 8 chars and include uppercase, lowercase, number and special char')
];

const verifyAccountValidation = [body('password').notEmpty().withMessage('Password is required')];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyAccountValidation
};
