import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getConversation } from '../controllers/messageController.js';

const router = express.Router();

router.get('/:otherUserId', protect, getConversation);

export default router;
