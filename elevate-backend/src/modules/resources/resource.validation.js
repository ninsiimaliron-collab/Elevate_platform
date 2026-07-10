const { body, query, param } = require('express-validator');

const createResourceValidation = [
  body('title').notEmpty().withMessage('title is required'),
  body('category')
    .isIn(['mentorship', 'free_courses', 'resume_tips', 'career_advice', 'skills_training'])
    .withMessage('Invalid category')
];

const updateResourceValidation = [param('id').notEmpty().withMessage('id is required')];

const listResourceValidation = [
  query('category')
    .optional()
    .isIn(['mentorship', 'free_courses', 'resume_tips', 'career_advice', 'skills_training'])
    .withMessage('Invalid category')
];

module.exports = {
  createResourceValidation,
  updateResourceValidation,
  listResourceValidation
};
