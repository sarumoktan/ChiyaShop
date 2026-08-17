const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { slugify } = require('../utils/slugify');

/** pg returns DECIMAL as a string; coerce to Number for clean JSON. */
const decimal = (field) => ({
  type: DataTypes.DECIMAL(10, 2),
  get() {
    const raw = this.getDataValue(field);
    return raw === null || raw === undefined ? null : Number.parseFloat(raw);
  },
});

class Product extends Model {
  get isDiscounted() {
    return this.compareAtPrice != null && this.compareAtPrice > this.price;
  }
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(140), allowNull: false, unique: true },
    tagline: { type: DataTypes.STRING(180), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    story: { type: DataTypes.TEXT, allowNull: true },

    price: { ...decimal('price'), allowNull: false, validate: { min: 0 } },
    compareAtPrice: { ...decimal('compareAtPrice'), allowNull: true },

    imageUrl: { type: DataTypes.STRING(600), allowNull: true },
    // Gradient pair used as an image placeholder / accent in the UI.
    accentFrom: { type: DataTypes.STRING(20), allowNull: true, defaultValue: '#d99a4e' },
    accentTo: { type: DataTypes.STRING(20), allowNull: true, defaultValue: '#7b4b25' },

    badge: { type: DataTypes.STRING(30), allowNull: true },
    tags: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    // [{ label: 'Regular', priceDelta: 0 }, ...]
    sizes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },

    caffeineLevel: {
      type: DataTypes.ENUM('none', 'low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
    calories: { type: DataTypes.INTEGER, allowNull: true },
    prepMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },

    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

    // Denormalised review aggregates, refreshed by the review controller.
    ratingAvg: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        return Number.parseFloat(this.getDataValue('ratingAvg') || 0);
      },
    },
    ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    soldCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    indexes: [{ fields: ['category_id'] }, { fields: ['is_featured'] }],
    hooks: {
      beforeValidate: (product) => {
        if (!product.slug && product.name) product.slug = slugify(product.name);
      },
    },
  }
);

module.exports = Product;
