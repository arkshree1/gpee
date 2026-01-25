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
      enum: ['applied', 'officeSecretary', 'dugc', 'hod', 'hostelOffice', 'completed'],
      default: 'officeSecretary', // Goes to office secretary immediately after submission
    },
    stageStatus: {
      officeSecretary: { type: stageDecisionSchema, default: () => ({}) },
      dugc: { type: stageDecisionSchema, default: () => ({}) },
      hod: { type: stageDecisionSchema, default: () => ({}) },
      hostelOffice: { type: stageDecisionSchema, default: () => ({}) },
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
    // Previous leaves taken - filled by Office Secretary
    previousLeavesTaken: {
      type: String,
      default: null,
      trim: true,
    },
    // Rejection reason - filled by whoever rejects (Secretary/DUGC/HOD/HostelOffice)
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
    // PhD-specific fields - Leave balance after taking this leave (filled by Office Secretary)
    phdLeaveBalance: {
      cl: { type: String, default: null, trim: true }, // Casual Leave balance
      medical: { type: String, default: null, trim: true }, // Medical leave balance
      other: { type: String, default: null, trim: true }, // Other leave type (specify)
      otherType: { type: String, default: null, trim: true }, // What type of other leave
    },
    // DUGC note - filled by DUGC for PhD students (shown to HOD)
    dugcNote: {
      type: String,
      default: null,
      trim: true,
    },
    // Who rejected and at which stage
    rejectedBy: {
      stage: {
        type: String,
        enum: ['officeSecretary', 'dugc', 'hod', 'hostelOffice'],
        default: null,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OutstationGatepass', outstationGatepassSchema);
