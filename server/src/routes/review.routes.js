const express = require('express');
const { param } = require('express-validator');
const ctrl = require('../controllers/review.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.delete('/:id', protect, param('id').isUUID(), validate, ctrl.deleteReview);

module.exports = router;
