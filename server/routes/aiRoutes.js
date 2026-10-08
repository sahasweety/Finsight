/**
 * server/routes/aiRoutes.js
 *
 * All routes are protected by authMiddleware — a valid Bearer JWT is required.
 * Route: POST /api/ai/insights
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAIInsights, chatWithAI } = require('../controllers/aiController');

// POST /api/ai/insights
router.post('/insights', protect, getAIInsights);

// POST /api/ai/chat
router.post('/chat', protect, chatWithAI);

module.exports = router;
