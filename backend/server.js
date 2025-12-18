const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
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

// MongoDB connection (UPDATED for Mongoose v7)
const mongoUri = process.env.MONGODB_URI;

mongoose
  .connect(mongoUri) // removed deprecated options
  .then(() => {
    console.log(`📦 MongoDB connected successfully`);
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
