const Budget = require('../models/Budget');

// @desc    Create a budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    // Validation
    if (!category || String(category).trim() === '') {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Amount is required.' });
    }

    if (!isFinite(amount)) {
      return res.status(400).json({ success: false, message: 'Amount must be a finite number.' });
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Month must be an integer between 1 and 12.' });
    }

    if (!Number.isInteger(year) || year < 2020) {
      return res.status(400).json({ success: false, message: 'Year must be an integer of 2020 or later.' });
    }

    const budget = await Budget.create({
      user: req.user.id,
      category: String(category).trim(),
      amount,
      month,
      year
    });

    res.status(201).json({ success: true, budget });
  } catch (error) {
    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Budget already exists for this category and month.' });
    }
    res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
};

// @desc    Get all budgets for the authenticated user
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id })
      .sort({ year: -1, month: -1, category: 1 });

    res.status(200).json({ success: true, budgets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res) => {
  try {
    // Ownership-scoped lookup — never trust client-supplied user
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user.id });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }

    const { category, amount, month, year } = req.body;

    // Validate only the fields that were supplied
    if (category !== undefined && String(category).trim() === '') {
      return res.status(400).json({ success: false, message: 'Category must not be empty.' });
    }

    if (amount !== undefined) {
      if (!isFinite(amount)) {
        return res.status(400).json({ success: false, message: 'Amount must be a finite number.' });
      }
      if (amount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
      }
    }

    if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) {
      return res.status(400).json({ success: false, message: 'Month must be an integer between 1 and 12.' });
    }

    if (year !== undefined && (!Number.isInteger(year) || year < 2020)) {
      return res.status(400).json({ success: false, message: 'Year must be an integer of 2020 or later.' });
    }

    // Build update object — never allow user/_id/createdAt to be changed
    const updates = {};
    if (category !== undefined) updates.category = String(category).trim();
    if (amount !== undefined)   updates.amount   = amount;
    if (month !== undefined)    updates.month    = month;
    if (year !== undefined)     updates.year     = year;

    const updatedBudget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, budget: updatedBudget });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Budget already exists for this category and month.' });
    }
    res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }

    res.status(200).json({ success: true, message: 'Budget deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
};
