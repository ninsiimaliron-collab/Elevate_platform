const { error: errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const notFoundHandler = (_req, _res, next) => {
  next(new AppError('Route not found', 404, 'NotFoundError'));
};

const globalErrorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || [];
  const type = err.type || 'UnhandledError';
  const shouldLogStack = statusCode >= 500 && type !== 'ValidationError';

  const logPayload = {
    type,
    message
  };

  if (shouldLogStack) {
    logPayload.stack = err.stack;
  }

  if (statusCode >= 500) {
    logger.error('Request failed', logPayload);
  } else {
    logger.warn('Request failed', logPayload);
  }

  return errorResponse(res, message, statusCode, errors);
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
