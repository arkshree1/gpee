const mongoose = require('mongoose');

const gateLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Denormalized student info (stored at log creation time for data persistence)
    studentName: {
      type: String,
      trim: true,
      default: null,
    },
    studentRollNumber: {
      type: String,
      trim: true,
      default: null,
    },
    studentRoomNumber: {
      type: String,
      trim: true,
      default: null,
    },
    studentContact: {
      type: String,
      trim: true,
      default: null,
    },
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guard',
      default: null,
      index: true,
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GateRequest',
      default: null,
      index: true,
    },
    direction: {
      type: String,
      enum: ['exit', 'entry'],
      required: true,
      index: true,
    },
    outcome: {
      type: String,
      enum: ['approved', 'denied', '--'],
      required: true,
      default: '--',
      index: true,
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    place: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    decidedAt: {
      type: Date,
      required: true,
      index: true,
    },
    gatepassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LocalGatepass',
      default: null,
    },
    gatePassNo: {
      type: String,
      default: null,
      trim: true,
    },
    // Expected return time from gatepass (if applicable)
    gatepassExpectedReturnTime: {
      type: Date,
      default: null,
    },
    // Whether this is an outstation gatepass
    isOutstationGatepass: {
      type: Boolean,
      default: false,
    },
    exitStatus: {
      type: String,
      required: true,
      default: '--',
      trim: true,
    },
    exitOutcome: {
      type: String,
      required: true,
      default: '--',
      trim: true,
    },
    entryStatus: {
      type: String,
      required: true,
      default: '--',
      trim: true,
    },
    entryOutcome: {
      type: String,
      required: true,
      default: '--',
      trim: true,
    },
    exitStatusTime: {
      type: Date,
      default: null,
      index: true,
    },
    entryStatusTime: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GateLog', gateLogSchema);
