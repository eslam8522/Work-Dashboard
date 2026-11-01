import express from 'express';
import {
  registerUser,
  loginUser,
  googleLogin,
  requestOtp,
  verifyOtp,
  getMe,
  getAllUsers,
  toggleBlockUser,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

// Authenticated
router.get('/me', protect, getMe);

// Super admin only
router.get('/users', protect, authorize('SUPERADMIN'), getAllUsers);
router.put('/users/:userId/block', protect, authorize('SUPERADMIN'), toggleBlockUser);

export default router;
