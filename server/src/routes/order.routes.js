const express = require('express');
const { body, param } = require('express-validator');
const ctrl = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

/* Static segments must be declared before the /:id catch-all. */
router.get('/stats', adminOnly, ctrl.orderStats);
router.get('/mine', ctrl.listMyOrders);
router.post('/preview', ctrl.previewOrder);

router.post(
  '/',
  [
    body('customerName').trim().isLength({ min: 2, max: 80 }).withMessage('Name is required.'),
    body('phone').trim().isLength({ min: 6, max: 30 }).withMessage('A phone number is required.'),
    body('fulfilment').optional().isIn(['delivery', 'pickup']),
    body('paymentMethod').optional().isIn(['cash', 'esewa', 'khalti', 'card']),
    body('address').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
    body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 400 }),
  ],
  validate,
  ctrl.createOrder
);

router.get('/', adminOnly, ctrl.listAllOrders);
router.get('/:id', param('id').isUUID(), validate, ctrl.getOrder);
router.post('/:id/cancel', param('id').isUUID(), validate, ctrl.cancelOrder);
router.patch(
  '/:id/status',
  adminOnly,
  [param('id').isUUID(), body('status').optional().isString()],
  validate,
  ctrl.updateOrderStatus
);

module.exports = router;
