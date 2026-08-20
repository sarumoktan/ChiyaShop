/**
 * Single source of truth for money maths — used by the cart, checkout preview
 * and order creation so the client can never disagree with the server total.
 */

const FREE_DELIVERY_THRESHOLD = 800;
const DELIVERY_FEE = 60;

const COUPONS = {
  CHIYA10: { type: 'percent', value: 10, label: '10% off your brew' },
  FIRSTSIP: { type: 'flat', value: 100, label: 'Rs 100 off your first order', minSubtotal: 500 },
  MOMO50: { type: 'flat', value: 50, label: 'Rs 50 off snacks', minSubtotal: 300 },
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Base price plus the delta for the chosen size. */
const priceForSize = (product, sizeLabel) => {
  const base = Number(product.price) || 0;
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const match = sizes.find((s) => s.label === sizeLabel);
  return round2(base + (match ? Number(match.priceDelta) || 0 : 0));
};

const lineTotal = (item) => round2((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0));

/**
 * @param {Array} items      cart items (or order-item-shaped objects)
 * @param {object} options   { couponCode, fulfilment }
 */
const summarise = (items = [], { couponCode = null, fulfilment = 'delivery' } = {}) => {
  const subtotal = round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  let discount = 0;
  let coupon = null;
  const code = couponCode ? String(couponCode).trim().toUpperCase() : null;

  if (code && COUPONS[code]) {
    const rule = COUPONS[code];
    if (!rule.minSubtotal || subtotal >= rule.minSubtotal) {
      discount = rule.type === 'percent' ? round2((subtotal * rule.value) / 100) : rule.value;
      discount = Math.min(discount, subtotal);
      coupon = { code, label: rule.label, applied: true };
    } else {
      coupon = {
        code,
        label: `Spend Rs ${rule.minSubtotal} to use ${code}`,
        applied: false,
      };
    }
  } else if (code) {
    coupon = { code, label: 'That coupon is not valid.', applied: false };
  }

  const isPickup = fulfilment === 'pickup';
  const deliveryFee =
    isPickup || subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  const total = round2(Math.max(subtotal - discount, 0) + deliveryFee);

  return {
    itemCount,
    subtotal,
    discount,
    deliveryFee,
    total,
    coupon,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
    amountToFreeDelivery: isPickup ? 0 : round2(Math.max(FREE_DELIVERY_THRESHOLD - subtotal, 0)),
  };
};

module.exports = {
  priceForSize,
  lineTotal,
  summarise,
  round2,
  COUPONS,
  FREE_DELIVERY_THRESHOLD,
  DELIVERY_FEE,
};
