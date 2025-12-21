const mongoose = require('mongoose');

const gateLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
