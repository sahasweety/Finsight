/**
 * server/routes/aiRoutes.js
 *
 * All routes are protected by authMiddleware — a valid Bearer JWT is required.
 * Route: POST /api/ai/insights
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for image uploads (5MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const { protect } = require('../middleware/authMiddleware');
const { getAIInsights, chatWithAI, extractTransactions } = require('../controllers/aiController');

// POST /api/ai/insights
router.post('/insights', protect, getAIInsights);

// POST /api/ai/chat
router.post('/chat', protect, chatWithAI);

// POST /api/ai/extract-transactions
router.post('/extract-transactions', protect, upload.single('image'), extractTransactions);

module.exports = router;
