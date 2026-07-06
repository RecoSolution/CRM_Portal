import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────
    firstName: {
      type: String,
      default: '',
      trim: true,
    },
    lastName: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    jobTitle: {
      type: String,
      default: '',
      trim: true,
    },

    // ── Auth ────────────────────────────────
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never return password in queries
    },
    role: {
      type: String,
      enum: ['employee', 'founder'],
      default: 'employee',
    },

    // ── Email Verification ──────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpire: {
      type: Date,
      select: false,
    },

    // ── Password Reset ──────────────────────
    resetOtp: {
      type: String,
      select: false,
    },
    resetOtpExpire: {
      type: Date,
      select: false,
    },

    resetOtpVerified: {
      type: Boolean,
      default: false,
      select: false,
    },    
    // ── Profile Setup ───────────────────────
    defaultEvent: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  },
);

// ── Virtual: full name for convenience ──────────────────
userSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`.trim()
})
userSchema.set('toJSON', { virtuals: true })
userSchema.set('toObject', { virtuals: true })

// ── Hash password before saving ─────────────────────────
// ── Hash password before saving ─────────────────────────
userSchema.pre('save', async function () {
  // Only hash if password was changed
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Compare entered password with hashed ────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// ── Generate 6-digit OTP (signup verification) ──────────
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  this.otp = otp
  this.otpExpire = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  return otp
}

// ── Generate 6-digit OTP (password reset) ───────────────
userSchema.methods.generateResetOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  this.resetOtp = otp
  this.resetOtpExpire = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  this.resetOtpVerified = false
  return otp
}

export default mongoose.model('User', userSchema);
