╔══════════════════════════════════════════════════════╗
║        PANCHAL BROTHERS — COMPLETE WEBSITE           ║
║        Frontend + Backend — Production Ready         ║
╚══════════════════════════════════════════════════════╝

FOLDER STRUCTURE
─────────────────
panchal-brothers-final/
├── frontend/
│   └── index.html          ← Complete website (open in browser)
│   └── Main.js             ← Complete website (open in browser)
│   └── style.css           ← Complete website (open in browser)
│   └── admin.html          ← Complete website (open in browser)
│   └── admin.js            ← Complete website (open in browser)
│   └── admin.css           ← Complete website (open in browser)
│   └── favicon.svg         ← Complete website (open in browser)
└── backend/
    ├── server.js           ← Express server entry point
    ├── .env.example        ← Copy to .env and fill in secrets
    ├── package.json        ← npm dependencies
    ├── config/email.js     ← Nodemailer email service
    ├── models/             ← MongoDB Mongoose schemas
    ├── routes/             ← API route definitions
    ├── controllers/        ← Business logic
    ├── middleware/         ← Auth + Validation
    └── scripts/seedAdmin.js

HOW TO RUN (BACKEND)
─────────────────────
1.  cd backend
2.  npm install
3.  cp .env.example .env
4.  Fill in MONGO_URI, EMAIL_USER, EMAIL_PASS, JWT_SECRET in .env
5.  node scripts/seedAdmin.js        ← creates admin user (once only)
6.  npm run dev                      ← starts server at localhost:5000

HOW TO USE (FRONTEND)
──────────────────────
• Open frontend/index.html in any browser
• The API_BASE is already set to http://localhost:5000/api
• To deploy: change API_BASE in index.html to your live server URL

API ENDPOINTS
──────────────
POST  /api/enquiry/submit       ← Contact form submission
GET   /api/contact/info         ← Company contact details
GET   /api/contact/services     ← Service list for dropdown
POST  /api/admin/login          ← Admin login
GET   /api/admin/enquiries      ← List all enquiries (protected)
PUT   /api/admin/enquiries/:id  ← Update enquiry status (protected)

WHAT'S CONNECTED (Frontend → Backend)
───────────────────────────────────────
✓ Contact form submits to POST /api/enquiry/submit
✓ On success: shows enquiry ID + sends 2 emails (customer + admin)
✓ On error: shows inline field errors from server validation
✓ Service dropdown loads live from GET /api/contact/services
✓ Contact info (phone, email, WhatsApp) loads from GET /api/contact/info
✓ Fallback: if backend offline, shows static values + direct call prompt

TECH STACK
───────────
Frontend : HTML5, CSS3, Vanilla JavaScript, Google Fonts
Backend  : Node.js, Express.js, MongoDB, Mongoose
Auth     : JWT + Bcryptjs
Email    : Nodemailer + Gmail SMTP
Security : Helmet, CORS, express-rate-limit, express-validator

Login credential:- 
──────────────
Superadmin: admin@panchalbrothers.com / Admin@PB2025
New admin: meeral@panchalbrothers.org / Meeral@2025

Runner code:-
──────────────
\backend :-  node server.js
\frontend :- npx -y serve . -p 3000

kill port backend:- npx kill-port 3000
kill port frontend:-npx  kill-port 5000 
