const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const money = (field) => ({
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  defaultValue: 0,
  get() {
    return Number.parseFloat(this.getDataValue(field) || 0);
  },
});

class OrderItem extends Model {}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Snapshot fields: an order receipt must survive product edits/deletes.
    name: { type: DataTypes.STRING(120), allowNull: false },
    imageUrl: { type: DataTypes.STRING(600), allowNull: true },
    size: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Regular' },
    sugar: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Normal' },
    unitPrice: money('unitPrice'),
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    lineTotal: money('lineTotal'),
  },
  {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    indexes: [{ fields: ['order_id'] }],
  }
);

module.exports = OrderItem;
