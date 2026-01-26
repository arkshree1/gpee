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

    // ==================== PhD-SPECIFIC FIELDS ====================
    // Instructor (Faculty) - only for PhD students
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null,
    },
    instructorName: {
      type: String,
      default: null,
      trim: true,
    },
    instructorDepartment: {
      type: String,
      default: null,
      trim: true,
    },

    // ==================== MULTI-STAGE WORKFLOW FIELDS ====================
    // For BTech/MBA: officeSecretary -> dugc -> hod -> hostelOffice
    // For PhD: instructor -> officeSecretary -> dpgc -> hod -> dean -> hostelOffice
    currentStage: {
      type: String,
      enum: ['applied', 'instructor', 'officeSecretary', 'dugc', 'dpgc', 'hod', 'dean', 'hostelOffice', 'completed'],
      default: 'officeSecretary', // Default for BTech/MBA, PhD will be set to 'instructor'
    },
    stageStatus: {
      instructor: { type: stageDecisionSchema, default: () => ({}) },      // PhD only
      officeSecretary: { type: stageDecisionSchema, default: () => ({}) },
      dugc: { type: stageDecisionSchema, default: () => ({}) },            // BTech/MBA only
      dpgc: { type: stageDecisionSchema, default: () => ({}) },            // PhD only
      hod: { type: stageDecisionSchema, default: () => ({}) },
      dean: { type: stageDecisionSchema, default: () => ({}) },            // PhD only
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

    // ==================== NOTES FROM EACH STAGE ====================
    // Previous leaves taken - filled by Office Secretary
    previousLeavesTaken: {
      type: String,
      default: null,
      trim: true,
    },
    // Notes from each approval stage (passed to next levels)
    instructorNote: {
      type: String,
      default: null,
      trim: true,
    },
    officeSecretaryNote: {
      type: String,
      default: null,
      trim: true,
    },
    dugcNote: {
      type: String,
      default: null,
      trim: true,
    },
    dpgcNote: {
      type: String,
      default: null,
      trim: true,
    },
    hodNote: {
      type: String,
      default: null,
      trim: true,
    },
    deanNote: {
      type: String,
      default: null,
      trim: true,
    },

    // ==================== PhD LEAVE BALANCE (filled by Office Secretary) ====================
    phdLeaveBalance: {
      cl: { type: String, default: null, trim: true },        // Casual Leave balance
      medical: { type: String, default: null, trim: true },   // Medical leave balance
      other: { type: String, default: null, trim: true },     // Other leave balance
      otherType: { type: String, default: null, trim: true }, // What type of other leave
    },

    // ==================== REJECTION TRACKING ====================
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
    rejectedBy: {
      stage: {
        type: String,
        enum: ['instructor', 'officeSecretary', 'dugc', 'dpgc', 'hod', 'dean', 'hostelOffice'],
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
