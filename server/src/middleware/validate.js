const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/** Turns express-validator results into a single 400 with a field map. */
const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const fields = {};
  for (const err of result.array()) {
    if (!fields[err.path]) fields[err.path] = err.msg;
  }

  next(ApiError.badRequest('Please check the highlighted fields.', fields));
};

module.exports = validate;
