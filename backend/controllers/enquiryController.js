// ============================================================
//  CONTROLLER : Enquiry
//  Handles: submit, list, view, update status, delete
// ============================================================

const Enquiry = require('../models/Enquiry');
const { sendCustomerConfirmation, sendAdminNotification } = require('../config/email');

// ── POST /api/enquiry/submit ──────────────────────────────
//    Public — receives form submission from website
const submitEnquiry = async (req, res, next) => {
  try {
    const { name, company, phone, email, service, message } = req.body;

    // Create enquiry in database
    const enquiry = await Enquiry.create({
      name, company, phone, email, service, message,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    // Send emails (async — don't block response)
    let emailSent = false;
    try {
      await Promise.all([
        sendCustomerConfirmation(enquiry),
        sendAdminNotification(enquiry),
      ]);
      emailSent = true;
      await Enquiry.findByIdAndUpdate(enquiry._id, { emailSent: true });
    } catch (emailErr) {
      console.warn('⚠️  Email sending failed:', emailErr.message);
      // Don't fail the request — enquiry is saved even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully! We will contact you within 24–48 hours.',
      enquiryId: enquiry._id.toString().slice(-8).toUpperCase(),
      emailSent,
    });

  } catch (err) {
    // Handle duplicate or DB errors gracefully
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(422).json({ error: 'Validation failed', details: messages });
    }
    next(err);
  }
};

// ── GET /api/admin/enquiries ──────────────────────────────
//    Protected — list all enquiries with filters & pagination
const getAllEnquiries = async (req, res, next) => {
  try {
    const {
      page     = 1,
      limit    = 20,
      status,
      service,
      search,
      sortBy   = 'createdAt',
      order    = 'desc',
    } = req.query;

    // Build filter
    const filter = {};
    if (status)  filter.status  = status;
    if (service) filter.service = service;
    if (search) {
      filter.$or = [
        { name    : { $regex: search, $options: 'i' } },
        { email   : { $regex: search, $options: 'i' } },
        { company : { $regex: search, $options: 'i' } },
        { phone   : { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const sort  = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Enquiry.countDocuments(filter),
    ]);

    // Summary counts by status
    const summary = await Enquiry.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data   : enquiries,
      pagination: {
        total,
        page     : parseInt(page),
        pages    : Math.ceil(total / parseInt(limit)),
        limit    : parseInt(limit),
      },
      summary: summary.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
    });

  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/enquiries/:id ──────────────────────────
//    Protected — get single enquiry detail
const getEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/admin/enquiries/:id ──────────────────────────
//    Protected — update status, priority, admin note
const updateEnquiry = async (req, res, next) => {
  try {
    const allowedFields = ['status', 'priority', 'adminNote'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.status === 'Responded') {
      updates.respondedAt = new Date();
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id, updates, { new: true, runValidators: true }
    );
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

    res.json({ success: true, message: 'Enquiry updated', data: enquiry });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/admin/enquiries/:id ──────────────────────
//    Protected — delete an enquiry
const deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/enquiries/stats ───────────────────────
//    Protected — dashboard statistics
const getStats = async (req, res, next) => {
  try {
    const [
      totalEnquiries,
      newEnquiries,
      inProgress,
      responded,
      thisMonth,
      byService,
    ] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'New' }),
      Enquiry.countDocuments({ status: 'In Progress' }),
      Enquiry.countDocuments({ status: 'Responded' }),
      Enquiry.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      Enquiry.aggregate([
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalEnquiries,
        newEnquiries,
        inProgress,
        responded,
        thisMonth,
        byService,
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitEnquiry,
  getAllEnquiries,
  getEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getStats,
};
