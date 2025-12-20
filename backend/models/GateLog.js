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
      enum: ['approved', 'rejected'],
      required: true,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GateLog', gateLogSchema);
