const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const money = (field, defaultValue = 0) => ({
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  defaultValue,
  get() {
    return Number.parseFloat(this.getDataValue(field) || 0);
  },
});

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'brewing',
  'on_the_way',
  'delivered',
  'cancelled',
];

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: { type: DataTypes.STRING(24), allowNull: false, unique: true },

    status: {
      type: DataTypes.ENUM(...ORDER_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },

    subtotal: money('subtotal'),
    deliveryFee: money('deliveryFee'),
    discount: money('discount'),
    total: money('total'),

    paymentMethod: {
      type: DataTypes.ENUM('cash', 'esewa', 'khalti', 'card'),
      allowNull: false,
      defaultValue: 'cash',
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
      allowNull: false,
      defaultValue: 'unpaid',
    },
    fulfilment: {
      type: DataTypes.ENUM('delivery', 'pickup'),
      allowNull: false,
      defaultValue: 'delivery',
    },

    customerName: { type: DataTypes.STRING(80), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: true },
    city: { type: DataTypes.STRING(80), allowNull: true },
    notes: { type: DataTypes.STRING(400), allowNull: true },
    couponCode: { type: DataTypes.STRING(40), allowNull: true },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    indexes: [{ fields: ['user_id'] }, { fields: ['status'] }],
  }
);

Order.STATUSES = ORDER_STATUSES;

module.exports = Order;
