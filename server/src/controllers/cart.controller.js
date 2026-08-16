const { CartItem, Product, Category } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { priceForSize, summarise } = require('../services/pricing.service');

const productInclude = {
  model: Product,
  as: 'product',
  include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'icon'] }],
};

const loadCart = (userId) =>
  CartItem.findAll({
    where: { userId },
    include: [productInclude],
    order: [['createdAt', 'ASC']],
  });

const respondWithCart = async (userId, res, message) => {
  const items = await loadCart(userId);
  res.json({
    success: true,
    ...(message ? { message } : {}),
    data: { items, summary: summarise(items) },
  });
};

/** GET /api/cart */
const getCart = asyncHandler(async (req, res) => {
  await respondWithCart(req.user.id, res);
});

/** POST /api/cart */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size = 'Regular', sugar = 'Normal', notes } = req.body;

  const product = await Product.findByPk(productId);
  if (!product) throw ApiError.notFound('That brew is not on the menu.');
  if (!product.isAvailable) throw ApiError.badRequest(`${product.name} is sold out right now.`);

  const qty = Math.min(Math.max(Number(quantity) || 1, 1), 99);
  const unitPrice = priceForSize(product, size);

  // Same product + size + sugar collapses into one line.
  const existing = await CartItem.findOne({
    where: { userId: req.user.id, productId, size, sugar },
  });

  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, 99);
    existing.unitPrice = unitPrice;
    if (notes !== undefined) existing.notes = notes;
    await existing.save();
  } else {
    await CartItem.create({
      userId: req.user.id,
      productId,
      quantity: qty,
      size,
      sugar,
      unitPrice,
      notes: notes || null,
    });
  }

  await respondWithCart(req.user.id, res, `${product.name} added to your cart.`);
});

/** PATCH /api/cart/:id */
const updateCartItem = asyncHandler(async (req, res) => {
  const item = await CartItem.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [{ model: Product, as: 'product' }],
  });
  if (!item) throw ApiError.notFound('Cart item not found.');

  const { quantity, size, sugar, notes } = req.body;

  if (quantity !== undefined) {
    const qty = Number(quantity);
    if (qty <= 0) {
      await item.destroy();
      return respondWithCart(req.user.id, res, 'Item removed.');
    }
    item.quantity = Math.min(qty, 99);
  }

  if (size !== undefined) {
    item.size = size;
    item.unitPrice = priceForSize(item.product, size);
  }
  if (sugar !== undefined) item.sugar = sugar;
  if (notes !== undefined) item.notes = notes;

  await item.save();
  await respondWithCart(req.user.id, res, 'Cart updated.');
});

/** DELETE /api/cart/:id */
const removeCartItem = asyncHandler(async (req, res) => {
  const item = await CartItem.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!item) throw ApiError.notFound('Cart item not found.');

  await item.destroy();
  await respondWithCart(req.user.id, res, 'Item removed from cart.');
});

/** DELETE /api/cart */
const clearCart = asyncHandler(async (req, res) => {
  await CartItem.destroy({ where: { userId: req.user.id } });
  await respondWithCart(req.user.id, res, 'Cart cleared.');
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart, loadCart };
