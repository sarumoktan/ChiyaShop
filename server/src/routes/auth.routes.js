const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Blunt brute-force guard on the credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Tell us your name.'),
    body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Use at least 8 characters.')
      .matches(/\d/)
      .withMessage('Include at least one number.'),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ min: 6, max: 30 })
      .withMessage('Enter a valid phone number.'),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Enter your password.'),
  ],
  validate,
  ctrl.login
);

router.get('/me', protect, ctrl.me);

router.patch(
  '/me',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('phone').optional({ values: 'null' }).trim().isLength({ max: 30 }),
    body('address').optional({ values: 'null' }).trim().isLength({ max: 255 }),
    body('city').optional({ values: 'null' }).trim().isLength({ max: 80 }),
  ],
  validate,
  ctrl.updateProfile
);

router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Enter your current password.'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Use at least 8 characters.')
      .matches(/\d/)
      .withMessage('Include at least one number.'),
  ],
  validate,
  ctrl.changePassword
);

module.exports = router;
