const { Op, fn, col, literal } = require('sequelize');
const { sequelize, Order, OrderItem, CartItem, Product, User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { summarise, lineTotal } = require('../services/pricing.service');

const ORDER_FLOW = ['pending', 'confirmed', 'brewing', 'on_the_way', 'delivered'];

/** CHY-250812-4821 */
const buildOrderNumber = () => {
  const now = new Date();
  const stamp = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const random = String(Math.floor(1000 + Math.random() * 9000));
  return `CHY-${stamp}-${random}`;
};

const orderInclude = [
  {
    model: OrderItem,
    as: 'items',
    include: [{ model: Product, as: 'product', attributes: ['id', 'slug', 'name', 'imageUrl'] }],
  },
];

/** POST /api/orders/preview — server-authoritative totals for the checkout page. */
const previewOrder = asyncHandler(async (req, res) => {
  const { couponCode, fulfilment = 'delivery' } = req.body;

  const items = await CartItem.findAll({ where: { userId: req.user.id } });
  if (!items.length) throw ApiError.badRequest('Your cart is empty.');

  res.json({ success: true, data: { summary: summarise(items, { couponCode, fulfilment }) } });
});

/** POST /api/orders */
const createOrder = asyncHandler(async (req, res) => {
  const {
    customerName,
    phone,
    address,
    city,
    notes,
    paymentMethod = 'cash',
    fulfilment = 'delivery',
    couponCode,
  } = req.body;

  if (fulfilment === 'delivery' && !address) {
    throw ApiError.badRequest('Please add a delivery address.', {
      address: 'Delivery address is required.',
    });
  }

  const order = await sequelize.transaction(async (tx) => {
    const cartItems = await CartItem.findAll({
      where: { userId: req.user.id },
      include: [{ model: Product, as: 'product' }],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!cartItems.length) throw ApiError.badRequest('Your cart is empty.');

    const unavailable = cartItems.filter((item) => !item.product || !item.product.isAvailable);
    if (unavailable.length) {
      throw ApiError.badRequest(
        `${unavailable.map((i) => i.product?.name || 'An item').join(', ')} is no longer available.`
      );
    }

    const summary = summarise(cartItems, { couponCode, fulfilment });

    const created = await Order.create(
      {
        orderNumber: buildOrderNumber(),
        userId: req.user.id,
        status: 'pending',
        subtotal: summary.subtotal,
        deliveryFee: summary.deliveryFee,
        discount: summary.discount,
        total: summary.total,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'unpaid' : 'paid',
        fulfilment,
        customerName: customerName || req.user.name,
        phone: phone || req.user.phone || '',
        address: fulfilment === 'delivery' ? address : null,
        city: city || req.user.city || null,
        notes: notes || null,
        couponCode: summary.coupon?.applied ? summary.coupon.code : null,
      },
      { transaction: tx }
    );

    await OrderItem.bulkCreate(
      cartItems.map((item) => ({
        orderId: created.id,
        productId: item.productId,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        size: item.size,
        sugar: item.sugar,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: lineTotal(item),
      })),
      { transaction: tx }
    );

    // Popularity counter drives the "Most loved" sort on the menu.
    await Promise.all(
      cartItems.map((item) =>
        Product.increment('soldCount', {
          by: item.quantity,
          where: { id: item.productId },
          transaction: tx,
        })
      )
    );

    await CartItem.destroy({ where: { userId: req.user.id }, transaction: tx });

    return created;
  });

  const full = await Order.findByPk(order.id, { include: orderInclude });

  res.status(201).json({
    success: true,
    message: `Order ${full.orderNumber} placed. Your chiya is on its way!`,
    data: { order: full },
  });
});

/** GET /api/orders/mine */
const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: orderInclude,
    order: [['createdAt', 'DESC']],
  });

  res.json({ success: true, data: { orders } });
});

/** GET /api/orders/:id — own order, or any order for an admin. */
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [...orderInclude, { model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
  });

  if (!order) throw ApiError.notFound('Order not found.');
  if (order.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('That order belongs to someone else.');
  }

  res.json({ success: true, data: { order } });
});

/** POST /api/orders/:id/cancel */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');
  if (order.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('That order belongs to someone else.');
  }
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw ApiError.badRequest('This order is already being prepared and cannot be cancelled.');
  }

  order.status = 'cancelled';
  await order.save();

  res.json({ success: true, message: 'Order cancelled.', data: { order } });
});

/** GET /api/orders (admin) */
const listAllOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const where = {};
  if (status && status !== 'all') where.status = status;
  if (search) {
    where[Op.or] = [
      { orderNumber: { [Op.iLike]: `%${search}%` } },
      { customerName: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const currentPage = Math.max(Number(page) || 1, 1);

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [...orderInclude, { model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit: perPage,
    offset: (currentPage - 1) * perPage,
    distinct: true,
  });

  res.json({
    success: true,
    data: {
      orders: rows,
      pagination: {
        total: count,
        page: currentPage,
        limit: perPage,
        totalPages: Math.max(Math.ceil(count / perPage), 1),
      },
    },
  });
});

/** PATCH /api/orders/:id/status (admin) */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.body;

  const order = await Order.findByPk(req.params.id, { include: orderInclude });
  if (!order) throw ApiError.notFound('Order not found.');

  if (status) {
    if (![...ORDER_FLOW, 'cancelled'].includes(status)) {
      throw ApiError.badRequest(`Unknown status "${status}".`);
    }
    order.status = status;
    if (status === 'delivered' && order.paymentMethod === 'cash') order.paymentStatus = 'paid';
  }
  if (paymentStatus) order.paymentStatus = paymentStatus;

  await order.save();

  res.json({ success: true, message: `Order marked ${order.status}.`, data: { order } });
});

/** GET /api/orders/stats (admin) */
const orderStats = asyncHandler(async (_req, res) => {
  const [totals] = await Order.findAll({
    attributes: [
      [fn('COUNT', col('id')), 'orderCount'],
      [fn('COALESCE', fn('SUM', col('total')), 0), 'revenue'],
      [fn('COALESCE', fn('AVG', col('total')), 0), 'averageOrderValue'],
    ],
    where: { status: { [Op.ne]: 'cancelled' } },
    raw: true,
  });

  const byStatus = await Order.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  const topProducts = await OrderItem.findAll({
    attributes: [
      'name',
      [fn('SUM', col('quantity')), 'unitsSold'],
      [fn('SUM', col('line_total')), 'revenue'],
    ],
    group: ['name'],
    order: [[literal('"unitsSold"'), 'DESC']],
    limit: 5,
    raw: true,
  });

  const [customerCount, productCount] = await Promise.all([
    User.count({ where: { role: 'user' } }),
    Product.count(),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        orderCount: Number(totals.orderCount) || 0,
        revenue: Number(totals.revenue) || 0,
        averageOrderValue: Number(totals.averageOrderValue) || 0,
        customerCount,
        productCount,
        byStatus: byStatus.map((row) => ({ status: row.status, count: Number(row.count) })),
        topProducts: topProducts.map((row) => ({
          name: row.name,
          unitsSold: Number(row.unitsSold),
          revenue: Number(row.revenue),
        })),
      },
    },
  });
});

module.exports = {
  previewOrder,
  createOrder,
  listMyOrders,
  getOrder,
  cancelOrder,
  listAllOrders,
  updateOrderStatus,
  orderStats,
  ORDER_FLOW,
};
