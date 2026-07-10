const success = (res, data = null, message = 'Success', statusCode = 200, pagination) => {
  const payload = {
    success: true,
    message,
    data
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  return res.status(statusCode).json(payload);
};

const error = (res, message = 'An error occurred', statusCode = 500, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = {
  success,
  error
};
