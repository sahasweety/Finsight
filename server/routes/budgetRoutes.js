const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');

router.route('/')
  .post(protect, createBudget)
  .get(protect, getBudgets);

router.route('/:id')
  .put(protect, updateBudget)
  .delete(protect, deleteBudget);

module.exports = router;
