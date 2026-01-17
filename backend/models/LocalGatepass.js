const mongoose = require('mongoose');

const localGatepassSchema = new mongoose.Schema(
  {
    gatePassNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    department: {
      type: String,
      required: true,
      trim: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
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
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    place: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    consent: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostelOffice',
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    utilized: {
      type: Boolean,
      default: false,
    },
    utilizationStatus: {
      type: String,
      enum: ['pending', 'in_use', 'completed'],
      default: 'pending',
    },
    actualExitAt: {
      type: Date,
      default: null,
    },
    actualEntryAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LocalGatepass', localGatepassSchema);
