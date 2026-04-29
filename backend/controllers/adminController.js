// ============================================================
//  CONTROLLER : Admin Authentication
//  Handles: login, get current admin, change password
// ============================================================

const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

// ── Sign JWT token ────────────────────────────────────────
const signToken = (id) => jwt.sign(
  { id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// ── POST /api/admin/login ─────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find admin by email (include password field)
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login timestamp
    await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() });

    // Generate JWT
    const token = signToken(admin._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id      : admin._id,
        name    : admin.name,
        email   : admin.email,
        role    : admin.role,
        lastLogin: admin.lastLogin,
      }
    });

  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/me ─────────────────────────────────────
const getMe = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

// ── PUT /api/admin/change-password ───────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin._id).select('+password');
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    admin.password = newPassword;  // pre-save hook will hash it
    await admin.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe, changePassword };
