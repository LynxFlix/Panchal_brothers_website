// ============================================================
//  MODEL : Enquiry
//  Stores every contact form submission from the website
// ============================================================

const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({

  // ── CONTACT DETAILS ──────────────────────────────────────
  name: {
    type    : String,
    required: [true, 'Name is required'],
    trim    : true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },

  company: {
    type    : String,
    trim    : true,
    maxlength: [150, 'Company name cannot exceed 150 characters'],
    default : '',
  },

  phone: {
    type    : String,
    required: [true, 'Phone number is required'],
    trim    : true,
    match   : [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
  },

  email: {
    type    : String,
    required: [true, 'Email is required'],
    trim    : true,
    lowercase: true,
    match   : [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },

  // ── ENQUIRY DETAILS ──────────────────────────────────────
  service: {
    type    : String,
    required: [true, 'Please select a service'],
    enum    : [
      'Chimney Manufacturing',
      'Parts & Components Supply',
      'Transportation',
      'Installation & Erection',
      'Maintenance & Repair',
      'Design Consultation',
      'Other',
    ],
  },

  message: {
    type    : String,
    required: [true, 'Message is required'],
    trim    : true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },

  // ── STATUS TRACKING ──────────────────────────────────────
  status: {
    type   : String,
    enum   : ['New', 'In Progress', 'Responded', 'Closed'],
    default: 'New',
  },

  priority: {
    type   : String,
    enum   : ['Low', 'Medium', 'High'],
    default: 'Medium',
  },

  adminNote: {
    type   : String,
    default: '',
    trim   : true,
  },

  // ── METADATA ─────────────────────────────────────────────
  ipAddress: {
    type: String,
    default: '',
  },

  userAgent: {
    type: String,
    default: '',
  },

  emailSent: {
    type   : Boolean,
    default: false,
  },

  respondedAt: {
    type: Date,
  },

}, {
  timestamps: true,   // adds createdAt and updatedAt automatically
});

// ── INDEXES for fast queries ──────────────────────────────
enquirySchema.index({ status: 1 });
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ email: 1 });

// ── VIRTUAL: formatted date ───────────────────────────────
enquirySchema.virtual('createdAtFormatted').get(function () {
  return this.createdAt.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
});

module.exports = mongoose.model('Enquiry', enquirySchema);
