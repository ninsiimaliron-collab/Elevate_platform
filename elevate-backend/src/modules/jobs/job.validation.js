const { body, param, query } = require('express-validator');

const createJobValidation = [
  body('title').notEmpty().withMessage('title is required'),
  body('job_type').optional().isIn(['full-time', 'part-time', 'internship', 'apprenticeship', 'contract', 'volunteer']),
  body('division').optional().isIn(['Central', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga'])
];

const updateJobValidation = [param('id').notEmpty().withMessage('id is required')];

const listJobsValidation = [
  query('division').optional().isIn(['Central', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga']),
  query('job_type').optional().isIn(['full-time', 'part-time', 'internship', 'apprenticeship', 'contract', 'volunteer'])
];

module.exports = {
  createJobValidation,
  updateJobValidation,
  listJobsValidation
};
