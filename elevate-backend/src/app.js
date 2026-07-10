const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const logger = require('./utils/logger');
const { success } = require('./utils/apiResponse');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter.middleware');
const { notFoundHandler, globalErrorHandler } = require('./middleware/error.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const jobRoutes = require('./modules/jobs/job.routes');
const applicationRoutes = require('./modules/applications/application.routes');
const resourceRoutes = require('./modules/resources/resource.routes');

const app = express();

const sanitizeInput = (obj) => {
  if (typeof obj === 'string') {
    return obj
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    Object.keys(obj).forEach((key) => {
      sanitized[key] = sanitizeInput(obj[key]);
    });
    return sanitized;
  }
  return obj;
};

app.use(helmet());
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use((req, _res, next) => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  next();
});
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.use(generalLimiter);

app.get('/health', (_req, res) => {
  success(res, { uptime: process.uptime(), timestamp: new Date().toISOString() }, 'Service healthy');
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/resources', resourceRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
