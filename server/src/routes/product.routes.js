const express = require('express');
const { body, param } = require('express-validator');
const ctrl = require('../controllers/product.controller');
const reviewCtrl = require('../controllers/review.controller');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', ctrl.listProducts);

/* Reviews live under their product. */
router.get('/:productId/reviews', param('productId').isUUID(), validate, reviewCtrl.listReviews);
router.post(
  '/:productId/reviews',
  protect,
  [
    param('productId').isUUID().withMessage('Invalid product.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Pick a rating from 1 to 5.'),
    body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 600 }),
  ],
  validate,
  reviewCtrl.upsertReview
);

router.get('/:slug', ctrl.getProduct);

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name is required.'),
    body('price').isFloat({ min: 0 }).withMessage('Enter a valid price.'),
    body('categoryId').optional({ values: 'falsy' }).isUUID(),
  ],
  validate,
  ctrl.createProduct
);

router.patch('/:id', protect, adminOnly, param('id').isUUID(), validate, ctrl.updateProduct);
router.delete('/:id', protect, adminOnly, param('id').isUUID(), validate, ctrl.deleteProduct);

module.exports = router;
