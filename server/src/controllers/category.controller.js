const { fn, col } = require('sequelize');
const { Category, Product } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/** GET /api/categories */
const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.findAll({
    attributes: {
      include: [[fn('COUNT', col('products.id')), 'productCount']],
    },
    include: [{ model: Product, as: 'products', attributes: [] }],
    group: ['Category.id'],
    order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    subQuery: false,
  });

  res.json({ success: true, data: { categories } });
});

/** POST /api/categories (admin) */
const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, message: 'Category created.', data: { category } });
});

/** PATCH /api/categories/:id (admin) */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  await category.update(req.body);
  res.json({ success: true, message: 'Category updated.', data: { category } });
});

/** DELETE /api/categories/:id (admin) */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  await category.destroy();
  res.json({ success: true, message: 'Category deleted.' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
