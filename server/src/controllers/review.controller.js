const { fn, col } = require('sequelize');
const { Review, Product, User, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/** Recomputes the denormalised rating fields on a product. */
const refreshProductRating = async (productId, transaction) => {
  const [agg] = await Review.findAll({
    attributes: [
      [fn('COALESCE', fn('AVG', col('rating')), 0), 'avg'],
      [fn('COUNT', col('id')), 'count'],
    ],
    where: { productId },
    raw: true,
    transaction,
  });

  await Product.update(
    {
      ratingAvg: Number(agg.avg || 0).toFixed(2),
      ratingCount: Number(agg.count) || 0,
    },
    { where: { id: productId }, transaction }
  );
};

/** GET /api/products/:productId/reviews */
const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.findAll({
    where: { productId: req.params.productId },
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatarUrl'] }],
    order: [['createdAt', 'DESC']],
  });

  res.json({ success: true, data: { reviews } });
});

/** POST /api/products/:productId/reviews — one review per user, upserted. */
const upsertReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  const product = await Product.findByPk(productId);
  if (!product) throw ApiError.notFound('Product not found.');

  const review = await sequelize.transaction(async (tx) => {
    const existing = await Review.findOne({
      where: { userId: req.user.id, productId },
      transaction: tx,
    });

    let saved;
    if (existing) {
      saved = await existing.update({ rating, comment }, { transaction: tx });
    } else {
      saved = await Review.create(
        { userId: req.user.id, productId, rating, comment },
        { transaction: tx }
      );
    }

    await refreshProductRating(productId, tx);
    return saved;
  });

  const withUser = await Review.findByPk(review.id, {
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatarUrl'] }],
  });

  res.status(201).json({
    success: true,
    message: 'Thanks for the review!',
    data: { review: withUser },
  });
});

/** DELETE /api/reviews/:id */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByPk(req.params.id);
  if (!review) throw ApiError.notFound('Review not found.');
  if (review.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own review.');
  }

  const { productId } = review;
  await sequelize.transaction(async (tx) => {
    await review.destroy({ transaction: tx });
    await refreshProductRating(productId, tx);
  });

  res.json({ success: true, message: 'Review deleted.' });
});

module.exports = { listReviews, upsertReview, deleteReview, refreshProductRating };
