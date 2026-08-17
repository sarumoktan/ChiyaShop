const express = require('express');
const { body, param } = require('express-validator');
const ctrl = require('../controllers/category.controller');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', ctrl.listCategories);

router.post(
  '/',
  protect,
  adminOnly,
  [body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name is required.')],
  validate,
  ctrl.createCategory
);

router.patch('/:id', protect, adminOnly, param('id').isUUID(), validate, ctrl.updateCategory);
router.delete('/:id', protect, adminOnly, param('id').isUUID(), validate, ctrl.deleteCategory);

module.exports = router;
