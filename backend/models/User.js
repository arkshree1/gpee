const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rollnumber: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
    branch: {
      type: String,
      trim: true,
      default: null,
    },
    course: {
      type: String,
      enum: ['BTech', 'MBA', 'PhD'],
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'guard', 'admin'],
      default: 'student',
    },
    presence: {
      type: String,
      // inside => on campus, outside => out of campus
      enum: ['inside', 'outside'],
      default: 'inside',
    },
    hostelName: {
      type: String,
      trim: true,
      default: null,
    },
    roomNumber: {
      type: String,
      trim: true,
      default: null,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: null,
    },
    outPurpose: {
      type: String,
      default: null,
      trim: true,
    },
    outPlace: {
      type: String,
      default: null,
      trim: true,
    },
    outTime: {
      type: Date,
      default: null,
    },
    imageUrl: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    localActiveGPNo: {
      type: String,
      default: null,
      trim: true,
    },
    OSActiveGPNo: {
      type: String,
      default: null,
      trim: true,
    },
    // Ban system fields - for admin to restrict student access
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: null,
      trim: true,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
