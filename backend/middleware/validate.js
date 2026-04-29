// ============================================================
//  MIDDLEWARE : Validation (express-validator)
//  Validates and sanitizes all incoming form data
// ============================================================

const { body, validationResult } = require('express-validator');

// ── Run validation results ────────────────────────────────
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error  : 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// ── Enquiry Form Validation Rules ─────────────────────────
const validateEnquiry = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
    .escape(),

  body('company')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Company name too long')
    .escape(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),

  body('service')
    .notEmpty().withMessage('Please select a service')
    .isIn([
      'Chimney Manufacturing',
      'Parts & Components Supply',
      'Transportation',
      'Installation & Erection',
      'Maintenance & Repair',
      'Design Consultation',
      'Other',
    ]).withMessage('Invalid service selected'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10–2000 characters')
    .escape(),

  handleValidation,
];

// ── Admin Login Validation ────────────────────────────────
const validateLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  handleValidation,
];

module.exports = { validateEnquiry, validateLogin, handleValidation };
