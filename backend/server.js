// ============================================================
//  PANCHAL BROTHERS – Backend Server (MongoDB + Mongoose)
//  Stack : Node.js + Express + Mongoose + Nodemailer + JWT
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'panchal_brothers_jwt_secret_2025';

// ── MONGOOSE SCHEMAS ─────────────────────────────────────────

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  company: { type: String, trim: true, default: '' },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  service: { type: String, required: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['New', 'In Progress', 'Responded', 'Closed'], default: 'New' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  adminNote: { type: String, default: '' },
  emailSent: { type: Boolean, default: false },
  respondedAt: { type: Date, default: null },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

const Enquiry = mongoose.model('Enquiry', enquirySchema);
const Admin = mongoose.model('Admin', adminSchema);

// ── CONNECT TO MONGODB ────────────────────────────────────────
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/panchal_brothers');
    console.log('✅  MongoDB connected');
    await seedAdmin();
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// ── SEED ADMIN ON FIRST RUN ───────────────────────────────────
async function seedAdmin() {
  const count = await Admin.countDocuments();
  if (count === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@PB2025', 12);
    await Admin.create({
      name: 'Panchal Brothers Admin',
      email: (process.env.ADMIN_EMAIL || 'admin@panchalbrothers.com').toLowerCase(),
      password: hash,
      role: 'superadmin',
      isActive: true,
    });
    console.log('✅  Admin account created:', process.env.ADMIN_EMAIL || 'admin@panchalbrothers.com');
    console.log('   Password:', process.env.ADMIN_PASSWORD || 'Admin@PB2025');
  }
}

// ── NODEMAILER ───────────────────────────────────────────────
let transporter = null;
try {
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  transporter.verify((err) => {
    if (err) console.warn('⚠️  Email not configured:', err.message);
    else console.log('✅  Email transporter ready');
  });
} catch (e) { console.warn('⚠️  Nodemailer not configured'); }

// ── SECURITY MIDDLEWARE ──────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('dev'));

// ── RATE LIMITING ────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests.' } });
app.use('/api/', limiter);

// ── AUTH HELPERS ─────────────────────────────────────────────
function signToken(id) { return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' }); }

async function protect(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token.' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) return res.status(401).json({ error: 'Admin not found.' });
    req.admin = admin;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ══════════════════════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════════════════════

// ── HEALTH ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', server: 'Panchal Brothers Backend (MongoDB)', time: new Date().toISOString(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ── CONTACT INFO ─────────────────────────────────────────────
app.get('/api/contact/info', (req, res) => {
  res.json({
    success: true, data: {
      company: 'Panchal Brothers', tagline: 'Industrial Chimney Experts',
      address: 'GIDC Industrial Area, Ahmedabad, Gujarat – 382430',
      phones: ['+91 98250 00000', '+91 97250 00000'],
      email: 'info@panchalbrothers.com',
      hours: 'Monday – Saturday: 9:00 AM – 6:30 PM',
      mapUrl: 'https://maps.google.com/?q=GIDC+Ahmedabad+Gujarat',
      social: { whatsapp: 'https://wa.me/916354807760' },
    }
  });
});

// ── SERVICES ─────────────────────────────────────────────────
app.get('/api/contact/services', (req, res) => {
  res.json({
    success: true, services: [
      'Chimney Manufacturing', 'Parts & Components Supply', 'Transportation',
      'Installation & Erection', 'Maintenance & Repair', 'Design Consultation', 'Other',
    ]
  });
});

// ── SUBMIT ENQUIRY ───────────────────────────────────────────
app.post('/api/enquiry/submit', async (req, res) => {
  const { name, company, phone, email, service, message } = req.body;

  // Validate
  const errors = [];
  if (!name || name.trim().length < 2) errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) errors.push({ field: 'phone', message: 'Enter a valid 10-digit Indian mobile number' });
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push({ field: 'email', message: 'Enter a valid email address' });
  if (!service) errors.push({ field: 'service', message: 'Please select a service' });
  if (!message || message.trim().length < 10) errors.push({ field: 'message', message: 'Message must be at least 10 characters' });
  if (errors.length) return res.status(422).json({ error: 'Validation failed', details: errors });

  try {
    const enquiry = await Enquiry.create({
      name: name.trim(),
      company: (company || '').trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      service,
      message: message.trim(),
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    const shortId = enquiry._id.toString().slice(-8).toUpperCase();

    // Send emails if configured
    if (transporter && process.env.EMAIL_USER && process.env.EMAIL_PASS !== 'your_gmail_app_password_here') {
      // Customer confirmation
      transporter.sendMail({
        from: `"Panchal Brothers" <${process.env.EMAIL_USER}>`,
        to: enquiry.email,
        subject: `✅ Enquiry Received — Panchal Brothers (#${shortId})`,
        html: customerEmailHtml(enquiry, shortId),
      }).then(async () => {
        await Enquiry.findByIdAndUpdate(enquiry._id, { emailSent: true });
      }).catch(e => console.warn('Customer email failed:', e.message));

      // Admin notification
      if (process.env.COMPANY_EMAIL) {
        transporter.sendMail({
          from: `"Panchal Brothers Website" <${process.env.EMAIL_USER}>`,
          to: process.env.COMPANY_EMAIL,
          subject: `🔔 New Enquiry: ${enquiry.name} — ${enquiry.service}`,
          html: adminEmailHtml(enquiry, shortId),
        }).catch(e => console.warn('Admin email failed:', e.message));
      }
    }

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully! We will contact you within 24–48 hours.',
      enquiryId: shortId,
      emailSent: enquiry.emailSent,
    });
  } catch (err) {
    console.error('Enquiry submit error:', err.message);
    res.status(500).json({ error: 'Failed to save enquiry.' });
  }
});

// ── ADMIN LOGIN ──────────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  try {
    const admin = await Admin.findOne({ email: email.toLowerCase(), isActive: true });
    if (!admin) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    admin.lastLogin = new Date();
    await admin.save();

    const token = signToken(admin._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ── ADMIN ME ─────────────────────────────────────────────────
app.get('/api/admin/me', protect, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// ── CREATE ADMIN (superadmin only) ───────────────────────────
app.post('/api/admin/create', protect, async (req, res) => {
  if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'An admin with this email already exists.' });

    const hash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hash,
      role: role === 'superadmin' ? 'superadmin' : 'admin',
      isActive: true,
    });
    res.status(201).json({ success: true, message: 'Admin created', admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create admin.' });
  }
});

// ── LIST ADMINS (superadmin only) ────────────────────────────
app.get('/api/admin/list', protect, async (req, res) => {
  if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
  try {
    const admins = await Admin.find().select('-password').lean();
    res.json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admins.' });
  }
});

// ── DELETE ADMIN (superadmin only) ───────────────────────────
app.delete('/api/admin/:id', protect, async (req, res) => {
  if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
  if (req.admin._id.toString() === req.params.id) return res.status(400).json({ error: 'You cannot delete yourself.' });
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json({ success: true, message: `Admin "${admin.name}" deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete admin.' });
  }
});

// ── ENQUIRY STATS (must be before /:id) ─────────────────────
app.get('/api/admin/enquiries/stats', protect, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, newCount, inProgress, responded, thisMonth, byService] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'New' }),
      Enquiry.countDocuments({ status: 'In Progress' }),
      Enquiry.countDocuments({ status: 'Responded' }),
      Enquiry.countDocuments({ createdAt: { $gte: monthStart } }),
      Enquiry.aggregate([{ $group: { _id: '$service', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    ]);

    res.json({
      success: true, stats: {
        totalEnquiries: total,
        newEnquiries: newCount,
        inProgress,
        responded,
        thisMonth,
        byService,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ── LIST ENQUIRIES ───────────────────────────────────────────
app.get('/api/admin/enquiries', protect, async (req, res) => {
  let { page = 1, limit = 15, status, service, search, sortBy = 'createdAt', order = 'desc' } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  try {
    const filter = {};
    if (status) filter.status = status;
    if (service) filter.service = service;
    if (search) {
      const q = new RegExp(search, 'i');
      filter.$or = [{ name: q }, { email: q }, { company: q }, { phone: q }];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const total = await Enquiry.countDocuments(filter);
    const data = await Enquiry.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Summary counts by status
    const summaryRaw = await Enquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const summary = {};
    summaryRaw.forEach(s => { summary[s._id] = s.count; });

    res.json({ success: true, data, pagination: { total, page, pages: Math.ceil(total / limit), limit }, summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enquiries.' });
  }
});

// ── GET SINGLE ENQUIRY ───────────────────────────────────────
app.get('/api/admin/enquiries/:id', protect, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enquiry.' });
  }
});

// ── UPDATE ENQUIRY ───────────────────────────────────────────
app.put('/api/admin/enquiries/:id', protect, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['status', 'priority', 'adminNote'];
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.body.status === 'Responded') updates.respondedAt = new Date();

    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ success: true, message: 'Enquiry updated', data: enquiry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update enquiry.' });
  }
});

// ── DELETE ENQUIRY ───────────────────────────────────────────
app.delete('/api/admin/enquiries/:id', protect, async (req, res) => {
  if (req.admin.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin only' });
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete enquiry.' });
  }
});

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── ERROR HANDLER ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ── START ─────────────────────────────────────────────────
// On Vercel, the module is imported directly (no listen needed).
// Locally, we start the server normally.
connectDB();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀  Panchal Brothers Backend running → http://localhost:${PORT}`);
    console.log(`🍃  MongoDB: ${process.env.MONGO_URI || 'mongodb://localhost:27017/panchal_brothers'}`);
    console.log(`🔑  Admin: ${process.env.ADMIN_EMAIL || 'admin@panchalbrothers.com'} / ${process.env.ADMIN_PASSWORD || 'Admin@PB2025'}`);
  });
}

module.exports = app;

// ── EMAIL TEMPLATES ───────────────────────────────────────────
function customerEmailHtml(e, shortId) {
  return `<!DOCTYPE html><html><head><style>
    body{margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif}
    .w{max-width:600px;margin:30px auto;background:#fff;border-radius:4px;overflow:hidden}
    .h{background:#0A0A0A;padding:36px 40px;text-align:center}
    .h h1{color:#F5C200;font-size:26px;margin:0;letter-spacing:3px}
    .h p{color:#888;font-size:13px;margin:6px 0 0}
    .b{padding:36px 40px}
    .b h2{color:#0A0A0A;margin:0 0 16px}
    .b p{color:#444;font-size:15px;line-height:1.7;margin:0 0 14px}
    .box{background:#f9f9f9;border-left:4px solid #F5C200;padding:18px 22px;margin:22px 0;border-radius:2px}
    .box p{margin:6px 0;font-size:14px;color:#333}
    .f{background:#0A0A0A;padding:22px 40px;text-align:center}
    .f p{color:#555;font-size:12px;margin:4px 0}
  </style></head><body>
  <div class="w">
    <div class="h"><h1>PANCHAL BROTHERS</h1><p>Industrial Chimney Experts · Gujarat, India</p></div>
    <div class="b">
      <h2>Thank you for your enquiry, ${e.name}!</h2>
      <p>We have received your message and our team will get back to you within <strong>24–48 business hours</strong>.</p>
      <div class="box">
        <p><strong>Enquiry ID :</strong> #${shortId}</p>
        <p><strong>Service    :</strong> ${e.service}</p>
        <p><strong>Name       :</strong> ${e.name}</p>
        <p><strong>Phone      :</strong> ${e.phone}</p>
        <p><strong>Message    :</strong> ${e.message}</p>
      </div>
      <p>Feel free to reach us directly:<br>📞 <strong>+91 98250 00000</strong> | ✉️ <strong>info@panchalbrothers.com</strong></p>
    </div>
    <div class="f"><p>© ${new Date().getFullYear()} Panchal Brothers. All rights reserved.</p><p>GIDC Industrial Area, Ahmedabad, Gujarat – 382430</p></div>
  </div></body></html>`;
}

function adminEmailHtml(e, shortId) {
  return `<!DOCTYPE html><html><head><style>
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
    .w{max-width:600px;margin:30px auto;background:#fff;border-radius:4px;overflow:hidden}
    .h{background:#F5C200;padding:24px 32px}.h h1{color:#0A0A0A;font-size:22px;margin:0}
    table{width:100%;border-collapse:collapse}
    td{padding:10px 14px;font-size:14px;border-bottom:1px solid #eee}
    td:first-child{font-weight:700;color:#0A0A0A;width:35%;background:#fafafa}
    .f{background:#0A0A0A;color:#888;text-align:center;padding:18px;font-size:12px}
  </style></head><body>
  <div class="w">
    <div class="h"><h1>🔔 New Enquiry — #${shortId}</h1></div>
    <table>
      <tr><td>Name</td><td>${e.name}</td></tr>
      <tr><td>Company</td><td>${e.company || '—'}</td></tr>
      <tr><td>Phone</td><td>${e.phone}</td></tr>
      <tr><td>Email</td><td>${e.email}</td></tr>
      <tr><td>Service</td><td>${e.service}</td></tr>
      <tr><td>Message</td><td>${e.message}</td></tr>
      <tr><td>Submitted</td><td>${new Date().toLocaleString('en-IN')}</td></tr>
    </table>
    <div class="f">Login to admin panel to manage this enquiry.</div>
  </div></body></html>`;
}
