import express from 'express';
import { generateContent } from '../ai/gemini.js';

const router = express.Router();

/**
 * GET /api/test-gemini
 * Verifies the API key and connection by asking for a trilingual greeting.
 */
router.get('/test-gemini', async (req, res, next) => {
  try {
    const hardcodedPrompt = "Say 'API connection successful!' in English, Sinhala, and Tamil. Keep it brief.";
    
    const aiResponse = await generateContent(hardcodedPrompt);
    
    res.json({ 
      success: true, 
      message: "Gemini is connected and working!",
      aiResponse: aiResponse 
    });
  } catch (error) {
    // Passes the error to the global error handler in index.js
    next(error); 
  }
});

export default router;