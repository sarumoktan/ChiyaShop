const express = require('express');
const { body, param } = require('express-validator');
const ctrl = require('../controllers/cart.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // the cart is always per-user

router.get('/', ctrl.getCart);

router.post(
  '/',
  [
    body('productId').isUUID().withMessage('Invalid product.'),
    body('quantity').optional().isInt({ min: 1, max: 99 }),
    body('size').optional().trim().isLength({ max: 40 }),
    body('sugar').optional().trim().isLength({ max: 40 }),
    body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 240 }),
  ],
  validate,
  ctrl.addToCart
);

router.patch(
  '/:id',
  [param('id').isUUID(), body('quantity').optional().isInt({ min: 0, max: 99 })],
  validate,
  ctrl.updateCartItem
);

router.delete('/:id', param('id').isUUID(), validate, ctrl.removeCartItem);
router.delete('/', ctrl.clearCart);

module.exports = router;
