const QRCode = require('qrcode');
const User = require('../models/User');
const GateRequest = require('../models/GateRequest');
const { generateRawToken, hashToken } = require('../utils/security');

const TOKEN_TTL_MS = 5 * 60 * 1000;

const getDirectionFromPresence = (presence) => {
  // If student is inside campus => they can request exit.
  // If outside => they can request entry.
  return presence === 'inside' ? 'exit' : 'entry';
};

exports.getStatus = async (req, res) => {
  const userId = req.user.userId;

  const student = await User.findById(userId).select('presence role name rollnumber imageUrl');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const pendingRequest = await GateRequest.findOne({
    student: userId,
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).select('_id direction purpose place expiresAt createdAt');

  return res.json({
    presence: student.presence,
    nextAction: getDirectionFromPresence(student.presence),
    hasPendingRequest: !!pendingRequest,
    pendingRequest,
  });
};

exports.apply = async (req, res) => {
  const userId = req.user.userId;
  const { purpose, place } = req.body;

  if (!purpose || !place) {
    return res.status(400).json({ message: 'Purpose and place are required' });
  }

  const student = await User.findById(userId).select('presence role');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Prevent applying if an active pending request exists.
  const activePending = await GateRequest.findOne({
    student: userId,
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (activePending) {
    return res.status(409).json({ message: 'You already have a pending request' });
  }

  const direction = getDirectionFromPresence(student.presence);

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const requestDoc = await GateRequest.create({
    student: userId,
    direction,
    purpose,
    place,
    tokenHash,
    expiresAt,
  });

  // QR contains ONLY the random token.
  const qrDataUrl = await QRCode.toDataURL(rawToken, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 8,
  });

  return res.status(201).json({
    requestId: requestDoc._id,
    token: rawToken,
    expiresAt,
    qrDataUrl,
    direction,
  });
};
