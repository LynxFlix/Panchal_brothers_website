// ============================================================
//  ROUTES : Admin (Protected)
//  Base URL: /api/admin
// ============================================================

const express  = require('express');
const router   = express.Router();

const { login, getMe, changePassword }                                        = require('../controllers/adminController');
const { getAllEnquiries, getEnquiry, updateEnquiry, deleteEnquiry, getStats } = require('../controllers/enquiryController');
const { protect, superAdminOnly }                                             = require('../middleware/auth');
const { validateLogin }                                                       = require('../middleware/validate');

// ── AUTH ROUTES (Public) ──────────────────────────────────
router.post('/login',          validateLogin, login);

// ── PROTECTED ROUTES (require valid JWT) ─────────────────
router.use(protect);   // All routes below this line require auth

router.get('/me',              getMe);
router.put('/change-password', changePassword);

// ── ENQUIRY MANAGEMENT ────────────────────────────────────
router.get ('/enquiries/stats',  getStats);
router.get ('/enquiries',        getAllEnquiries);
router.get ('/enquiries/:id',    getEnquiry);
router.put ('/enquiries/:id',    updateEnquiry);
router.delete('/enquiries/:id', superAdminOnly, deleteEnquiry);

module.exports = router;
