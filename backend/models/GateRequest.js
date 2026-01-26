const mongoose = require('mongoose');

const gateRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['exit', 'entry'],
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    place: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'user dismissed qr'],
      default: 'pending',
      index: true,
    },
    tokenHash: {
      // Store only a hash server-side; QR contains only the raw token.
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
      index: true,
    },
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guard',
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    gatePassNo: {
      type: String,
      default: null,
      trim: true,
    },
    // Gatepass-specific fields (null for normal/instant exit)
    gatepassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LocalGatepass',
      default: null,
    },
    gatepassOutTime: {
      // Scheduled out date+time from gatepass form (e.g., "2025-12-25T10:00")
      type: String,
      default: null,
    },
    gatepassInTime: {
      // Scheduled in date+time from gatepass form (e.g., "2025-12-25T18:00")
      type: String,
      default: null,
    },
    isOutstation: {
      // Flag to distinguish outstation gatepass from local gatepass
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Helps keep the collection small even if something isn't marked used.
gateRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
//hey
module.exports = mongoose.model('GateRequest', gateRequestSchema);
