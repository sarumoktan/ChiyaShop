const express = require('express');
const { COUPONS, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } = require('../services/pricing.service');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/products', require('./product.routes'));
router.use('/categories', require('./category.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/orders', require('./order.routes'));
router.use('/reviews', require('./review.routes'));

/** Shop-wide constants the storefront renders (delivery banner, coupon hints). */
router.get('/shop-config', (_req, res) => {
  res.json({
    success: true,
    data: {
      currency: 'Rs',
      deliveryFee: DELIVERY_FEE,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      coupons: Object.entries(COUPONS).map(([code, rule]) => ({ code, label: rule.label })),
      paymentMethods: [
        { value: 'cash', label: 'Cash on delivery' },
        { value: 'esewa', label: 'eSewa' },
        { value: 'khalti', label: 'Khalti' },
        { value: 'card', label: 'Card' },
      ],
    },
  });
});

module.exports = router;
