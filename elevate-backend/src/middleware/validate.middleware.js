const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

const runValidation = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(
      new ValidationError(
        'Validation failed',
        result.array().map((err) => ({ field: err.path, message: err.msg }))
      )
    );
  }
  return next();
};

module.exports = {
  runValidation
};
