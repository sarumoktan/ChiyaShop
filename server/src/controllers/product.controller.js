const { Op } = require('sequelize');
const { Product, Category, Review, User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { slugify } = require('../utils/slugify');

const SORTS = {
  featured: [['isFeatured', 'DESC'], ['soldCount', 'DESC']],
  popular: [['soldCount', 'DESC']],
  rating: [['ratingAvg', 'DESC'], ['ratingCount', 'DESC']],
  'price-asc': [['price', 'ASC']],
  'price-desc': [['price', 'DESC']],
  newest: [['createdAt', 'DESC']],
  name: [['name', 'ASC']],
};

/** GET /api/products */
const listProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    tag,
    featured,
    minPrice,
    maxPrice,
    sort = 'featured',
    page = 1,
    limit = 12,
  } = req.query;

  const where = {};
  const include = [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'icon'] }];

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { tagline: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { tags: { [Op.overlap]: [String(search).toLowerCase()] } },
    ];
  }

  if (category && category !== 'all') {
    include[0].where = { slug: category };
    include[0].required = true;
  }

  if (tag) where.tags = { [Op.contains]: [tag] };
  if (featured !== undefined) where.isFeatured = featured === 'true';

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = Number(minPrice);
    if (maxPrice) where.price[Op.lte] = Number(maxPrice);
  }

  const perPage = Math.min(Math.max(Number(limit) || 12, 1), 48);
  const currentPage = Math.max(Number(page) || 1, 1);

  const { rows, count } = await Product.findAndCountAll({
    where,
    include,
    order: SORTS[sort] || SORTS.featured,
    limit: perPage,
    offset: (currentPage - 1) * perPage,
    distinct: true,
  });

  res.json({
    success: true,
    data: {
      products: rows,
      pagination: {
        total: count,
        page: currentPage,
        limit: perPage,
        totalPages: Math.max(Math.ceil(count / perPage), 1),
      },
    },
  });
});

/** GET /api/products/:slug — id or slug both work. */
const getProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  const product = await Product.findOne({
    where: isUuid ? { id: slug } : { slug },
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'icon'] },
      {
        model: Review,
        as: 'reviews',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatarUrl'] }],
        order: [['createdAt', 'DESC']],
        limit: 20,
        separate: true,
      },
    ],
  });

  if (!product) throw ApiError.notFound('We could not find that brew.');

  // A few same-category suggestions for the detail page.
  const related = await Product.findAll({
    where: {
      id: { [Op.ne]: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    limit: 4,
    order: [['soldCount', 'DESC']],
  });

  res.json({ success: true, data: { product, related } });
});

/** POST /api/products (admin) */
const createProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.slug && payload.name) payload.slug = slugify(payload.name);

  const product = await Product.create(payload);
  res.status(201).json({
    success: true,
    message: `${product.name} added to the menu.`,
    data: { product },
  });
});

/** PATCH /api/products/:id (admin) */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  await product.update(req.body);
  res.json({ success: true, message: `${product.name} updated.`, data: { product } });
});

/** DELETE /api/products/:id (admin) */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  await product.destroy();
  res.json({ success: true, message: `${product.name} removed from the menu.` });
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
