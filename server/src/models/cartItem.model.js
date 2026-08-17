const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class CartItem extends Model {}

CartItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1, max: 99 },
    },
    size: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Regular' },
    sugar: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Normal' },
    // Unit price captured at add-to-cart time (base + size delta).
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        return Number.parseFloat(this.getDataValue('unitPrice') || 0);
      },
    },
    notes: { type: DataTypes.STRING(240), allowNull: true },
  },
  {
    sequelize,
    modelName: 'CartItem',
    tableName: 'cart_items',
    indexes: [
      { unique: true, fields: ['user_id', 'product_id', 'size', 'sugar'] },
    ],
  }
);

module.exports = CartItem;
