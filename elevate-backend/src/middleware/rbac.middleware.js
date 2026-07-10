const { ForbiddenError } = require('../utils/errors');

const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    return next();
  };
};

module.exports = {
  authorize
};
