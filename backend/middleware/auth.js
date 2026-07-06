import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

// ── Protect: user must be logged in ─────────────────────
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login.',
    });
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Attach user to request
  req.user = await User.findById(decoded.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not found.',
    });
  }

  next();
});

// ── requireFounder: user must have role = founder ────────
const requireFounder = (req, res, next) => {
  if (req.user.role !== 'founder') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Founders only.',
    });
  }
  next();
};

// ── requireEmployee: user must have role = employee ───────
const requireEmployee = (req, res, next) => {
  if (req.user.role !== 'employee') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Employees only.',
    });
  }
  next();
};

// ── requireOwnerOrFounder: founder always passes; employee ──
// passes only if they own/are assigned the record. Attach this
// AFTER the record is loaded onto req (see usage note below).
// Usage in a controller route: load doc first, then call next()
// only if `doc[ownerField] === req.user.id` or role is founder.
const requireOwnerOrFounder = (ownerField = 'assignedTo') => {
  return (req, res, next) => {
    if (req.user.role === 'founder') return next();

    const doc = req.resourceDoc; // controller must set req.resourceDoc before this middleware runs
    if (!doc) {
      return res.status(500).json({
        success: false,
        message:
          'Server misconfiguration: resource not loaded for ownership check.',
      });
    }

    const ownerId = doc[ownerField]?._id
      ? doc[ownerField]._id.toString()
      : doc[ownerField]?.toString();

    if (ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not your assigned record.',
      });
    }
    next();
  };
};

// ── Verified only: email must be verified ───────────────
const verifiedOnly = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email first.',
    });
  }
  next();
};

export {
  protect,
  requireFounder,
  requireEmployee,
  requireOwnerOrFounder,
  verifiedOnly,
};
