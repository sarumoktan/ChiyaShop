const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { slugify } = require('../utils/slugify');

class Category extends Model {}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    tagline: { type: DataTypes.STRING(160), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    // Emoji or icon key rendered by the client.
    icon: { type: DataTypes.STRING(40), allowNull: true, defaultValue: '🍵' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    hooks: {
      beforeValidate: (category) => {
        if (!category.slug && category.name) category.slug = slugify(category.name);
      },
    },
  }
);

module.exports = Category;
