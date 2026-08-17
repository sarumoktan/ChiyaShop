const sequelize = require('../config/database');

const User = require('./user.model');
const Category = require('./category.model');
const Product = require('./product.model');
const CartItem = require('./cartItem.model');
const Order = require('./order.model');
const OrderItem = require('./orderItem.model');
const Review = require('./review.model');

/* ── Associations ──────────────────────────────────────────────── */

// Category 1–N Product
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', onDelete: 'SET NULL' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// User 1–N CartItem, Product 1–N CartItem
User.hasMany(CartItem, { foreignKey: 'userId', as: 'cartItems', onDelete: 'CASCADE' });
CartItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems', onDelete: 'CASCADE' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// User 1–N Order
User.hasMany(Order, { foreignKey: 'userId', as: 'orders', onDelete: 'SET NULL' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Order 1–N OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems', onDelete: 'SET NULL' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Reviews
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  CartItem,
  Order,
  OrderItem,
  Review,
};
