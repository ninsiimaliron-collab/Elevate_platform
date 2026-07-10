const { body, param, query } = require('express-validator');
const { UGANDA_PHONE_REGEX } = require('../../config/constants');
const { calcAge } = require('../../utils/helpers');

const updateYouthProfileValidation = [
  body('date_of_birth').optional().isISO8601().withMessage('date_of_birth must be a valid date'),
  body('date_of_birth').optional().custom((value) => {
    const age = calcAge(value);
    if (age < 18 || age > 30) {
      throw new Error('Youth age must be between 18 and 30');
    }
    return true;
  }),
  body('division').optional().isIn(['Central', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga'])
];

const updateEmployerProfileValidation = [
  body('location_division').optional().isIn(['Central', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga']),
  body('phone').optional().matches(UGANDA_PHONE_REGEX).withMessage('Must be valid Ugandan phone number')
];

const userListValidation = [
  query('role').optional().isIn(['youth', 'employer', 'admin']),
  query('is_active').optional().isBoolean(),
  query('division').optional().isIn(['Central', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga'])
];

const userIdValidation = [param('id').isUUID().withMessage('Invalid user id')];

const setStatusValidation = [
  ...userIdValidation,
  body('is_active').isBoolean().withMessage('is_active is required')
];

const verifyEmployerValidation = [
  param('id').isUUID().withMessage('Invalid employer user id'),
  body('registration_status').isIn(['verified', 'rejected']).withMessage('registration_status must be verified or rejected')
];

module.exports = {
  updateYouthProfileValidation,
  updateEmployerProfileValidation,
  userListValidation,
  userIdValidation,
  setStatusValidation,
  verifyEmployerValidation
};
