// ============================================================
//  MIDDLEWARE : Auth (JWT Verification)
//  Protects admin routes — verifies Bearer token
// ============================================================

const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  try {
    // 1. Check token exists in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // 2. Extract and verify token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check admin still exists and is active
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Admin account not found or deactivated.' });
    }

    // 4. Attach admin to request
    req.admin = admin;
    next();

  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    next(err);
  }
};

// ── Restrict to superadmin only ───────────────────────────
const superAdminOnly = (req, res, next) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied. Superadmin only.' });
  }
  next();
};

module.exports = { protect, superAdminOnly };
