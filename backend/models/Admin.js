// ============================================================
//  MODEL : Admin
//  Admin users who can log in to manage enquiries
// ============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const adminSchema = new mongoose.Schema({

  name: {
    type    : String,
    required: [true, 'Name is required'],
    trim    : true,
    maxlength: 100,
  },

  email: {
    type     : String,
    required : [true, 'Email is required'],
    unique   : true,
    lowercase: true,
    trim     : true,
    match    : [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },

  password: {
    type    : String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select  : false,     // Never returned in queries by default
  },

  role: {
    type   : String,
    enum   : ['superadmin', 'admin'],
    default: 'admin',
  },

  isActive: {
    type   : Boolean,
    default: true,
  },

  lastLogin: {
    type: Date,
  },

}, { timestamps: true });

// ── HASH PASSWORD BEFORE SAVE ─────────────────────────────
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── METHOD: Compare password ──────────────────────────────
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
