const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // Allow images from API origin and data URLs for QR/fallback avatars
        'img-src': [
          "'self'",
          'data:',
          process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
          process.env.BACKEND_ORIGIN || 'http://localhost:5000',
        ],
      },
    },
    // Permit cross-origin resources (frontend at :3000 fetching images from :5000)
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

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
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

const { bootstrapDefaultAccounts } = require('./utils/bootstrap');

// MongoDB connection (UPDATED for Mongoose v7)
const mongoUri = process.env.MONGODB_URI;

mongoose
  .connect(mongoUri) // removed deprecated options
  .then(async () => {
    console.log(`📦 MongoDB connected successfully`);
    await bootstrapDefaultAccounts();
  })
  .catch((err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1); // fail fast is FAANG-level
  });

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
