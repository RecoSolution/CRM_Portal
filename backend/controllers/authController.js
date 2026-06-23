import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendTokenResponse } from '../utils/generateToken.js';
import { sendOTPEmail, sendResetOTPEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';
import cloudinary from '../config/cloudinary.js';

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register new user + send OTP
// @access  Public
// Body: { firstName, lastName, email, password, phone?, jobTitle? }
// ────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered. Please login.',
    });
  }

  const user = await User.create({
    firstName: '',
    lastName: '',
    email,
    password,
  });

  const otp = user.generateOTP();
  await user.save();
  await sendOTPEmail(email, 'there', otp);

  res.status(201).json({
    success: true,
    message: 'Account created! Please check your email for the OTP.',
    email,
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/verify-otp
// @desc    Verify email OTP (signup verification)
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
  if (user.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }
  if (user.otpExpire < Date.now()) {
    return res
      .status(400)
      .json({ success: false, message: 'OTP expired. Request a new one.' });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/resend-otp
// @desc    Resend OTP email (signup verification)
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
  await sendOTPEmail(email, user.firstName, otp);

  res.json({ success: true, message: 'New OTP sent to your email.' });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// ────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Please provide email and password.' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid email or password.' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid email or password.' });
  }

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
// @access  Private
// ────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/setup-profile
// @desc    Complete profile setup ("Set Up Your Profile" screen)
// @access  Private
// Body: { firstName, lastName, jobTitle, phone, defaultEvent? }
// ────────────────────────────────────────────────────────
const setupProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, jobTitle, phone, defaultEvent } = req.body;

  const update = { isProfileComplete: true };
  if (firstName) update.firstName = firstName;
  if (lastName) update.lastName = lastName;
  if (jobTitle) update.jobTitle = jobTitle;
  if (phone) update.phone = phone;
  if (defaultEvent) update.defaultEvent = defaultEvent;

  const user = await User.findByIdAndUpdate(req.user.id, update, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, user });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/upload-avatar
// @desc    Upload/replace profile photo ("Add a Profile Photo" screen)
// @access  Private
// Form-data: key "photo" (file)
// ────────────────────────────────────────────────────────
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'Please upload an image.' });
  }

  const base64Image = req.file.buffer.toString('base64');
  const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: 'recosolution/avatars',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
    ],
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: uploadResult.secure_url },
    { new: true },
  );

  res.json({ success: true, avatar: user.avatar, user });
});

// ────────────────────────────────────────────────────────
// @route   DELETE /api/auth/remove-avatar
// @desc    Remove profile photo ("Remove" button)
// @access  Private
// ────────────────────────────────────────────────────────
const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: '' },
    { new: true },
  );
  res.json({ success: true, user });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @desc    Send OTP for password reset ("Forgot Password" screen)
// @access  Public
// Body: { email }
// ────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.json({
      success: true,
      message: 'If that email exists, an OTP has been sent.',
    });
  }

  const otp = user.generateResetOTP();
  await user.save();
  await sendResetOTPEmail(user.email, user.firstName, otp);

  res.json({
    success: true,
    message: 'OTP sent to your email.',
    email: user.email,
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/verify-reset-otp
// @desc    Verify OTP for password reset ("Verify OTP" screen)
// @access  Public
// Body: { email, otp }
// ────────────────────────────────────────────────────────
const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select(
    '+resetOtp +resetOtpExpire',
  );

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  if (!user.resetOtp || user.resetOtp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }
  if (user.resetOtpExpire < Date.now()) {
    return res
      .status(400)
      .json({ success: false, message: 'OTP expired. Request a new one.' });
  }

  user.resetOtpVerified = true;
  await user.save();

  res.json({
    success: true,
    message: 'OTP verified. You can now set a new password.',
  });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/resend-reset-otp
// @access  Public
// ────────────────────────────────────────────────────────
const resendResetOTP = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.json({
      success: true,
      message: 'If that email exists, an OTP has been sent.',
    });
  }

  const otp = user.generateResetOTP();
  await user.save();
  await sendResetOTPEmail(user.email, user.firstName, otp);

  res.json({ success: true, message: 'New OTP sent to your email.' });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/reset-password
// @desc    Set new password after OTP verified ("Create Password" screen)
// @access  Public
// Body: { email, password }
// ────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select(
    '+resetOtpVerified +resetOtp +resetOtpExpire',
  );

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  if (!user.resetOtpVerified) {
    return res.status(400).json({
      success: false,
      message: 'Please verify the OTP before setting a new password.',
    });
  }

  user.password = password;
  user.resetOtp = undefined;
  user.resetOtpExpire = undefined;
  user.resetOtpVerified = false;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully.' });
});

// ────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
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
  uploadAvatar,
  removeAvatar,
  forgotPassword,
  verifyResetOTP,
  resendResetOTP,
  resetPassword,
  logout,
};
