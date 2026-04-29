// ============================================================
//  ROUTES : Contact (Public info endpoints)
//  Base URL: /api/contact
// ============================================================

const express = require('express');
const router  = express.Router();

// GET /api/contact/info
// Returns company contact information (used by frontend dynamically)
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      company  : 'Panchal Brothers',
      tagline  : 'Industrial Chimney Experts',
      address  : 'GIDC Industrial Area, Ahmedabad, Gujarat – 382430',
      phones   : ['+91 98250 00000', '+91 97250 00000'],
      email    : 'info@panchalbrothers.com',
      hours    : 'Monday – Saturday: 9:00 AM – 6:30 PM',
      mapUrl   : 'https://maps.google.com/?q=GIDC+Ahmedabad+Gujarat',
      social   : {
        whatsapp: 'https://wa.me/919825000000',
      }
    }
  });
});

// GET /api/contact/services
// Returns list of services (dropdown options for form)
router.get('/services', (req, res) => {
  res.json({
    success: true,
    services: [
      'Chimney Manufacturing',
      'Parts & Components Supply',
      'Transportation',
      'Installation & Erection',
      'Maintenance & Repair',
      'Design Consultation',
      'Other',
    ]
  });
});

module.exports = router;
