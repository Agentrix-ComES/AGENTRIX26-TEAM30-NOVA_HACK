import express from 'express';
import { handleChat } from '../controllers/chatController.js';

const router = express.Router();

/**
 * POST /api/chat
 * Main chat endpoint - accepts user query, returns AI response
 */
router.post('/chat', handleChat);

export default router;