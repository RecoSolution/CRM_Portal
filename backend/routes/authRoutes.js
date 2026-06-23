import express from 'express';
import {
   register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  setupProfile,
  uploadAvatar,
  removeAvatar,
  forgotPassword,
  verifyResetOTP,
  resendResetOTP,
  resetPassword,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

import upload from '../middleware/upload.js';
const router = express.Router();

// ── Public routes ────────────────────────────────────────
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);

// Forgot password — OTP based (matches design)
router.post('/forgot-password', forgotPassword); // Step 1: send OTP
router.post('/verify-reset-otp', verifyResetOTP); // Step 2: verify OTP
router.post('/resend-reset-otp', resendResetOTP); // Resend if needed
router.post('/reset-password', resetPassword); // Step 3: set new password

// ── Private routes ───────────────────────────────────────
router.get('/me', protect, getMe);
router.post('/setup-profile', protect, setupProfile);
router.post('/upload-avatar', protect, upload.single('photo'), uploadAvatar);
router.delete('/remove-avatar', protect, removeAvatar);
router.post('/logout', protect, logout);

export default router;
