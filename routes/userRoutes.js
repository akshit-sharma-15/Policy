const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');
const chatService = require('../services/chatService');

// Get recommendation based on user profile
router.post('/recommend', async (req, res) => {
  try {
    const userProfile = req.body;
    
    // Validate required fields
    const required = ['fullName', 'age', 'lifestyle', 'conditions', 'incomeBand', 'cityTier'];
    for (const field of required) {
      if (!userProfile[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const recommendation = await recommendationService.generateRecommendation(userProfile);
    res.json(recommendation);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoint for follow-up questions
router.post('/chat', async (req, res) => {
  try {
    const { userProfile, conversationHistory, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatService.handleChat(userProfile, conversationHistory || [], message);
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
