/**
 * server/controllers/aiController.js
 *
 * POST /api/ai/insights
 *
 * Security model:
 *  - req.user.id comes from authMiddleware (verified JWT) — never from the request body.
 *  - Only that user's transactions are fetched from MongoDB.
 *  - The financial summary sent to Gemini contains ONLY calculated numbers,
 *    never raw DB documents, passwords, tokens, or connection strings.
 */

const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { generateFinancialInsights, generateChatResponse } = require('../services/aiService');

// ── Financial summary builder ──────────────────────────────────────────────

/**
 * Calculates a financial summary from a user's transaction array.
 * This is the ONLY data sent to the AI — no raw Mongoose documents, no PII.
 *
 * @param {Array} transactions - Mongoose Transaction documents (already scoped to req.user.id)
 * @param {Array} budgets - Mongoose Budget documents
 * @returns {object} financialSummary
 */
function buildFinancialSummary(transactions, budgets = []) {
  let totalIncome = 0;
  let totalExpenses = 0;
  const expenseByCategory = {};
  const monthlyIncome = {};
  const monthlyExpenses = {};

  for (const t of transactions) {
    const monthKey = new Date(t.date).toISOString().slice(0, 7); // "YYYY-MM"

    if (t.type === 'income') {
      totalIncome += t.amount;
      monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + t.amount;
    } else if (t.type === 'expense') {
      totalExpenses += t.amount;
      monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + t.amount;

      const cat = t.category || 'Uncategorized';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.amount;
    }
  }

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate,
    transactionCount: transactions.length,
    expenseByCategory,   // { "Food": 3200, "Transport": 1100, ... }
    monthlyIncome,       // { "2025-03": 45000, ... }
    monthlyExpenses,     // { "2025-03": 12000, ... }
    budgets,             // Array of budget objects
  };
}

// ── Controller ─────────────────────────────────────────────────────────────

/**
 * @desc    Generate AI-powered financial insights for the authenticated user
 * @route   POST /api/ai/insights
 * @access  Private (requires Bearer token via authMiddleware)
 */
const getAIInsights = async (req, res) => {
  try {
    // req.user.id is set by authMiddleware from the verified JWT.
    // We NEVER accept a userId from the request body.
    const userId = req.user.id;

    // Fetch ONLY this user's transactions — scoped by userId.
    const transactions = await Transaction.find({ user: userId })
      .select('type amount category date') // select only what's needed; omit _id, user ref, etc.
      .lean();                             // plain JS objects, not Mongoose documents

    if (transactions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No transactions found. Add some transactions to get AI insights.',
        insights: null,
      });
    }

    // Fetch ONLY this user's budgets
    const budgets = await Budget.find({ user: userId })
      .select('category amount month year')
      .lean();

    // Build the summary that will be sent to Gemini
    const financialSummary = buildFinancialSummary(transactions, budgets);

    // Call the AI service — GEMINI_API_KEY is read from process.env inside aiService.js
    const insights = await generateFinancialInsights(financialSummary);

    // Validate that the response has the expected shape before returning
    if (!insights || typeof insights !== 'object') {
      throw new Error('AI returned an unexpected response format.');
    }

    return res.status(200).json({
      success: true,
      insights,
    });

  } catch (error) {
    console.error('[aiController] Error generating insights:', error.message);

    // Never expose internal error details (stack traces, DB info, API keys) to the client
    const isApiKeyError = error.message.includes('GEMINI_API_KEY');
    const clientMessage = isApiKeyError
      ? 'AI service is not configured. Please contact the administrator.'
      : 'Failed to generate AI insights. Please try again later.';

    return res.status(500).json({
      success: false,
      message: clientMessage,
    });
  }
};

/**
 * @desc    Chat with AI about finances
 * @route   POST /api/ai/chat
 * @access  Private (requires Bearer token)
 */
const chatWithAI = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const transactions = await Transaction.find({ user: userId }).select('type amount category date').lean();
    const budgets = await Budget.find({ user: userId }).select('category amount month year').lean();

    const financialSummary = buildFinancialSummary(transactions, budgets);

    const reply = await generateChatResponse(message, financialSummary);

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error('[aiController] Error generating chat:', error.message);
    const isApiKeyError = error.message.includes('GEMINI_API_KEY') || error.message.includes('OPENROUTER_API_KEY');
    const clientMessage = isApiKeyError
      ? 'AI service is not configured. Please contact the administrator.'
      : 'Sorry, I couldn\'t process that request right now. Please try again.';

    return res.status(500).json({
      success: false,
      message: clientMessage,
    });
  }
};

module.exports = { getAIInsights, chatWithAI };
