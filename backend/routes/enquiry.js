// ============================================================
//  ROUTES : Enquiry (Public)
//  Base URL: /api/enquiry
// ============================================================

const express  = require('express');
const router   = express.Router();
const { submitEnquiry } = require('../controllers/enquiryController');
const { validateEnquiry } = require('../middleware/validate');

// POST /api/enquiry/submit
// Public — Website contact form submission
router.post('/submit', validateEnquiry, submitEnquiry);

module.exports = router;
