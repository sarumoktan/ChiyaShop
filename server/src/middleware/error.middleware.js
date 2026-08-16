const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/* eslint-disable-next-line no-unused-vars */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on our end.';
  let details = err.details || null;

  // Sequelize validation / uniqueness → 400 / 409 with a field map.
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Please check the highlighted fields.';
    details = Object.fromEntries(err.errors.map((e) => [e.path, e.message]));
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    details = Object.fromEntries(err.errors.map((e) => [e.path, e.message]));
    message = err.errors[0]?.message || 'That value is already taken.';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
  } else if (err.name === 'SequelizeDatabaseError') {
    statusCode = 400;
    message = 'The request could not be processed.';
  }

  if (statusCode >= 500) {
    console.error('\x1b[31m[error]\x1b[0m', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
