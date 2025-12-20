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
  },
  {
    timestamps: true,
  }
);

// Helps keep the collection small even if something isn't marked used.
gateRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('GateRequest', gateRequestSchema);
