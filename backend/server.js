const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Build allowed origins for CSP
const frontendOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const backendOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:5000';

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // Allow images from anywhere (needed for uploaded images over HTTP/HTTPS)
        'img-src': ["'self'", 'data:', 'blob:', '*'],
      },
    },
    // Permit cross-origin resources (frontend fetching images from backend)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.disable('x-powered-by');

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);

// CORS configuration - supports multiple origins via comma-separated FRONTEND_ORIGIN
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allowww requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploaded images
const uploadsPath = process.env.IMAGE_UPLOAD_PATH || './uploads';
app.use('/uploads', express.static(path.resolve(__dirname, uploadsPath)));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const studentRoutes = require('./routes/student');
app.use('/api/student', studentRoutes);

const guardRoutes = require('./routes/guard');
app.use('/api/guard', guardRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const hostelOfficeRoutes = require('./routes/hostelOffice');
app.use('/api/hostel-office', hostelOfficeRoutes);

const officeSecretaryRoutes = require('./routes/officeSecretary');
app.use('/api/office-secretary', officeSecretaryRoutes);

const dugcRoutes = require('./routes/dugc');
app.use('/api/dugc', dugcRoutes);

const hodRoutes = require('./routes/hod');
app.use('/api/hod', hodRoutes);

const facultyRoutes = require('./routes/faculty');
app.use('/api/faculty', facultyRoutes);

const dpgcRoutes = require('./routes/dpgc');
app.use('/api/dpgc', dpgcRoutes);

const deanRoutes = require('./routes/dean');
app.use('/api/dean', deanRoutes);

const { bootstrapDefaultAccounts } = require('./utils/bootstrap');

// MongoDB connection (UPDATED for Mongoose v7)
const mongoUri = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

mongoose
  .connect(mongoUri) // removed deprecated options
  .then(async () => {
    console.log(`📦 MongoDB connected successfully`);
    await bootstrapDefaultAccounts();

    // Start HTTP server on localhost only
    // HTTPS is handled at the proxy/CDN level (Cloudflare + IIS)
    app.listen(PORT, 'localhost', () => {
      console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1); // fail fast is FAANG-level
  });

