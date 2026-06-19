import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendTokenResponse } from '../utils/generateToken.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register new user + send OTP
// @access  Public
// ────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, company, email, phone, designation, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered. Please login.',
    });
  }

  // Create user
  const user = await User.create({
    name,
    company,
    email,
    phone,
    designation,
    password,
  });

  // Generate OTP and send email
  const otp = user.generateOTP();
  await user.save();
  await sendOTPEmail(email, name, otp);

  res.status(201).json({
    success: true,
    message: 'Account created! Please check your email for the OTP.',
    email,
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/verify-otp
// @desc    Verify email OTP
// @access  Public
// ────────────────────────────────────────────────────────
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+otp +otpExpire');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (user.isVerified) {
    return res
      .status(400)
      .json({ success: false, message: 'Email already verified.' });
  }

  // Check OTP match
  if (user.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }

  // Check OTP expiry
  if (user.otpExpire < Date.now()) {
    return res
      .status(400)
      .json({ success: false, message: 'OTP expired. Request a new one.' });
  }

  // Mark as verified and clear OTP
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/resend-otp
// @desc    Resend OTP email
// @access  Public
// ────────────────────────────────────────────────────────
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (user.isVerified) {
    return res
      .status(400)
      .json({ success: false, message: 'Email already verified.' });
  }

  const otp = user.generateOTP();
  await user.save();
  await sendOTPEmail(email, user.name, otp);

  res.json({ success: true, message: 'New OTP sent to your email.' });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
// ────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Please provide email and password.' });
  }

  // Get user with password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid email or password.' });
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid email or password.' });
  }

  // Check if verified
  if (!user.isVerified) {
    return res.status(401).json({
      success: false,
      message: 'Please verify your email first.',
      needsVerification: true,
      email: user.email,
    });
  }

  sendTokenResponse(user, 200, res);
});

// ────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
// ────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/setup-profile
// @desc    Complete profile setup after registration
// @access  Private
// ────────────────────────────────────────────────────────
const setupProfile = asyncHandler(async (req, res) => {
  const { role, defaultEvent } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { role, defaultEvent, isProfileComplete: true },
    { new: true, runValidators: true },
  );

  res.json({ success: true, user });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
// ────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // Don't reveal if email exists
    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendPasswordResetEmail(user.email, user.name, resetUrl);

  res.json({
    success: true,
    message: 'If that email exists, a reset link has been sent.',
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using token from email
// @access  Public
// ────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  // Hash the token from URL
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid or expired reset link.' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// @desc    Logout (client clears token)
// @access  Private
// ────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

export {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  setupProfile,
  forgotPassword,
  resetPassword,
  logout,
};
