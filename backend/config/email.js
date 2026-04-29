// ============================================================
//  CONFIG : Email Service (Nodemailer)
//  Sends 2 emails on every enquiry:
//    1. Confirmation email → to the customer
//    2. Notification email → to company admin
// ============================================================

const nodemailer = require('nodemailer');

// ── TRANSPORTER SETUP ────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host  : process.env.EMAIL_HOST   || 'smtp.gmail.com',
  port  : parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',   // true for port 465
  auth  : {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── VERIFY CONNECTION ────────────────────────────────────────
transporter.verify((error) => {
  if (error) {
    console.warn('⚠️  Email transporter not ready:', error.message);
  } else {
    console.log('✅  Email transporter ready');
  }
});

// ── EMAIL 1 : Customer Confirmation ─────────────────────────
const sendCustomerConfirmation = async (enquiry) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { margin:0; padding:0; background:#f4f4f4; font-family: 'Segoe UI', Arial, sans-serif; }
      .wrapper { max-width:600px; margin:30px auto; background:#ffffff; border-radius:4px; overflow:hidden; }
      .header  { background:#0A0A0A; padding:36px 40px; text-align:center; }
      .header h1 { color:#F5C200; font-size:28px; margin:0; letter-spacing:3px; }
      .header p  { color:#888; font-size:13px; margin:6px 0 0; }
      .body    { padding:36px 40px; }
      .body h2 { color:#0A0A0A; font-size:20px; margin:0 0 16px; }
      .body p  { color:#444; font-size:15px; line-height:1.7; margin:0 0 14px; }
      .detail-box { background:#f9f9f9; border-left:4px solid #F5C200; padding:18px 22px; margin:22px 0; border-radius:2px; }
      .detail-box p { margin:6px 0; font-size:14px; color:#333; }
      .detail-box strong { color:#0A0A0A; }
      .badge { display:inline-block; background:#F5C200; color:#0A0A0A; font-size:12px;
               font-weight:700; padding:4px 14px; letter-spacing:1px; border-radius:2px; }
      .footer { background:#0A0A0A; padding:22px 40px; text-align:center; }
      .footer p { color:#555; font-size:12px; margin:4px 0; }
      .footer a { color:#F5C200; text-decoration:none; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1>PANCHAL BROTHERS</h1>
        <p>Industrial Chimney Experts · Gujarat, India</p>
      </div>
      <div class="body">
        <h2>Thank you for your enquiry, ${enquiry.name}!</h2>
        <p>We have received your message and our team will get back to you within <strong>24–48 business hours</strong>.</p>
        <div class="detail-box">
          <p><strong>Enquiry ID :</strong> #${enquiry._id.toString().slice(-8).toUpperCase()}</p>
          <p><strong>Service    :</strong> ${enquiry.service}</p>
          <p><strong>Name       :</strong> ${enquiry.name}</p>
          <p><strong>Company    :</strong> ${enquiry.company || '—'}</p>
          <p><strong>Phone      :</strong> ${enquiry.phone}</p>
          <p><strong>Email      :</strong> ${enquiry.email}</p>
          <p><strong>Message    :</strong> ${enquiry.message}</p>
        </div>
        <p>In the meantime, feel free to reach us directly:</p>
        <p>📞 <strong>+91 98250 00000</strong> &nbsp;|&nbsp; ✉️ <strong>info@panchalbrothers.com</strong></p>
        <p style="margin-top:24px">
          <span class="badge">ENQUIRY RECEIVED</span>
        </p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Panchal Brothers. All rights reserved.</p>
        <p>GIDC Industrial Area, Ahmedabad, Gujarat – 382430</p>
        <p><a href="mailto:info@panchalbrothers.com">info@panchalbrothers.com</a></p>
      </div>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from   : `"Panchal Brothers" <${process.env.EMAIL_USER}>`,
    to     : enquiry.email,
    subject: `✅ Enquiry Received — Panchal Brothers (#${enquiry._id.toString().slice(-8).toUpperCase()})`,
    html,
  });
};

// ── EMAIL 2 : Admin Notification ─────────────────────────────
const sendAdminNotification = async (enquiry) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family:'Segoe UI',Arial,sans-serif; background:#f4f4f4; margin:0; padding:0; }
      .wrapper { max-width:600px; margin:30px auto; background:#fff; border-radius:4px; overflow:hidden; }
      .header { background:#F5C200; padding:24px 32px; }
      .header h1 { color:#0A0A0A; font-size:22px; margin:0; }
      .header p  { color:#333; font-size:13px; margin:4px 0 0; }
      .body { padding:28px 32px; }
      .row { display:flex; border-bottom:1px solid #eee; padding:10px 0; }
      table { width:100%; border-collapse:collapse; }
      td { padding:10px 14px; font-size:14px; border-bottom:1px solid #eee; }
      td:first-child { font-weight:700; color:#0A0A0A; width:35%; background:#fafafa; }
      .new-badge { background:#0A0A0A; color:#F5C200; padding:3px 12px; font-size:11px;
                   font-weight:700; letter-spacing:1px; border-radius:2px; }
      .footer { background:#0A0A0A; color:#888; text-align:center; padding:18px; font-size:12px; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1>🔔 New Enquiry Received</h1>
        <p>Panchal Brothers Website — ${new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</p>
      </div>
      <div class="body">
        <p><span class="new-badge">NEW</span></p>
        <table>
          <tr><td>Enquiry ID</td><td>#${enquiry._id.toString().slice(-8).toUpperCase()}</td></tr>
          <tr><td>Name</td><td>${enquiry.name}</td></tr>
          <tr><td>Company</td><td>${enquiry.company || '—'}</td></tr>
          <tr><td>Phone</td><td>${enquiry.phone}</td></tr>
          <tr><td>Email</td><td>${enquiry.email}</td></tr>
          <tr><td>Service</td><td>${enquiry.service}</td></tr>
          <tr><td>Message</td><td>${enquiry.message}</td></tr>
          <tr><td>IP Address</td><td>${enquiry.ipAddress}</td></tr>
          <tr><td>Submitted At</td><td>${new Date().toLocaleString('en-IN')}</td></tr>
        </table>
      </div>
      <div class="footer">Login to admin panel to update status and respond.</div>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from   : `"Panchal Brothers Website" <${process.env.EMAIL_USER}>`,
    to     : process.env.COMPANY_EMAIL,
    subject: `🔔 New Enquiry: ${enquiry.name} — ${enquiry.service}`,
    html,
  });
};

module.exports = { sendCustomerConfirmation, sendAdminNotification };
