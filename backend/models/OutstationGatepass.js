const mongoose = require('mongoose');

// Sub-schema for stage decision tracking
const stageDecisionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

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
    branch: {
      type: String,
      trim: true,
      default: null,
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
      default: null,
    },
    missedDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    proofFile: {
      type: String,
      default: null,
      trim: true,
    },
    consent: {
      type: Boolean,
      required: true,
      default: false,
    },
    // Multi-stage workflow fields
    currentStage: {
      type: String,
      enum: ['applied', 'officeSecretary', 'dugc', 'hod', 'completed'],
      default: 'officeSecretary', // Goes to office secretary immediately after submission
    },
    stageStatus: {
      officeSecretary: { type: stageDecisionSchema, default: () => ({}) },
      dugc: { type: stageDecisionSchema, default: () => ({}) },
      hod: { type: stageDecisionSchema, default: () => ({}) },
    },
    finalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    gatePassNo: {
      type: String,
      default: null,
      trim: true,
    },
    // Track if gatepass has been fully utilized (exited and entered back)
    utilized: {
      type: Boolean,
      default: false,
    },
    // Track actual exit and entry times (set by guard when approving)
    actualExitAt: {
      type: Date,
      default: null,
    },
    actualEntryAt: {
      type: Date,
      default: null,
    },
    utilizationStatus: {
      type: String,
      enum: ['pending', 'in_use', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OutstationGatepass', outstationGatepassSchema);
