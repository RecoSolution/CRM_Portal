import express from 'express';
import {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  setupProfile,
  forgotPassword,
  resetPassword,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Private routes
router.get('/me', protect, getMe);
router.post('/setup-profile', protect, setupProfile);
router.post('/logout', protect, logout);

export default router;
