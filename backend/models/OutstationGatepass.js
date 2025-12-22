const mongoose = require('mongoose');

const outstationGatepassSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    rollnumber: {
      type: String,
      required: true,
      trim: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    leaveDays: {
      type: Number,
      required: true,
      min: 1,
    },
    dateOut: {
      type: String,
      required: true,
      trim: true,
    },
    timeOut: {
      type: String,
      required: true,
      trim: true,
    },
    dateIn: {
      type: String,
      required: true,
      trim: true,
    },
    timeIn: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    natureOfLeave: {
      type: String,
      required: true,
      trim: true,
    },
    reasonOfLeave: {
      type: String,
      required: true,
      trim: true,
    },
    classesMissed: {
      type: String,
      enum: ['yes', 'no'],
      required: true,
    },
    missedDays: {
      type: Number,
      required: true,
      min: 0,
    },
    consent: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OutstationGatepass', outstationGatepassSchema);
