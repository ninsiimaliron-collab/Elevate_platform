const { body, param, query } = require('express-validator');

const applyValidation = [
  param('jobId').notEmpty().withMessage('jobId is required'),
  body('cover_letter').optional().isString()
];

const listMyValidation = [query('status').optional().isIn(['pending', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'])];

const updateStatusValidation = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('status').isIn(['under_review', 'shortlisted', 'accepted', 'rejected']).withMessage('Invalid status transition')
];

module.exports = {
  applyValidation,
  listMyValidation,
  updateStatusValidation
};
