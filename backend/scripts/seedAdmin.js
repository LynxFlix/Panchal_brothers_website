// ============================================================
//  SCRIPT : Seed Admin User
//  Run once with: node scripts/seedAdmin.js
//  Creates the first superadmin account
// ============================================================

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Admin    = require('../models/Admin');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/panchal_brothers');
    console.log('✅  Connected to MongoDB');

    // Check if admin already exists
    const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (existing) {
      console.log('⚠️  Admin already exists:', existing.email);
      process.exit(0);
    }

    // Create superadmin
    const admin = await Admin.create({
      name    : 'Panchal Brothers Admin',
      email   : process.env.ADMIN_EMAIL   || 'admin@panchalbrothers.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@PB2025',
      role    : 'superadmin',
    });

    console.log('✅  Admin created successfully!');
    console.log('   Email   :', admin.email);
    console.log('   Password:', process.env.ADMIN_PASSWORD || 'Admin@PB2025');
    console.log('   ⚠️  CHANGE YOUR PASSWORD after first login!');

    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
};

seedAdmin();
