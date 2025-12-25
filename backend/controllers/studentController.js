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

  const student = await User.findById(userId).select('presence role name rollnumber imageUrl department roomNumber contactNumber');
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
    // Student profile data for forms
    studentName: student.name,
    rollnumber: student.rollnumber,
    department: student.department,
    roomNumber: student.roomNumber,
    contactNumber: student.contactNumber,
  });
};

exports.apply = async (req, res) => {
  const userId = req.user.userId;
  const { purpose, place } = req.body;

  const student = await User.findById(userId).select('presence role outPurpose outPlace outTime');
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

  let effectivePurpose = purpose;
  let effectivePlace = place;

  if (direction === 'exit') {
    if (!effectivePurpose || !effectivePlace) {
      return res.status(400).json({ message: 'Purpose and place are required' });
    }
  } else if (direction === 'entry') {
    effectivePurpose = student.outPurpose;
    effectivePlace = student.outPlace;

    if (!effectivePurpose || !effectivePlace) {
      return res.status(400).json({ message: 'No previous exit details found for entry request' });
    }
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const requestDoc = await GateRequest.create({
    student: userId,
    direction,
    purpose: effectivePurpose,
    place: effectivePlace,
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

exports.cancel = async (req, res) => {
  const userId = req.user.userId;

  const pendingRequest = await GateRequest.findOne({
    student: userId,
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!pendingRequest) {
    return res.status(404).json({ message: 'No active request to cancel' });
  }

  pendingRequest.status = 'user dismissed qr';
  pendingRequest.usedAt = new Date();
  pendingRequest.decidedAt = new Date();
  await pendingRequest.save();

  return res.json({ message: 'Request dismissed successfully' });
};

// Get student's local gatepasses for tracking
const LocalGatepass = require('../models/LocalGatepass');

exports.getMyGatepasses = async (req, res) => {
  const userId = req.user.userId;

  const gatepasses = await LocalGatepass.find({ student: userId })
    .sort({ createdAt: -1 })
    .select('-__v');

  return res.json({ gatepasses });
};

// Generate QR for gatepass exit
exports.applyGatepassExit = async (req, res) => {
  const userId = req.user.userId;
  const { gatepassId } = req.body;

  if (!gatepassId) {
    return res.status(400).json({ message: 'Gatepass ID is required' });
  }

  const student = await User.findById(userId).select('presence');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  if (student.presence !== 'inside') {
    return res.status(400).json({ message: 'You are already outside campus' });
  }

  // Check for existing pending request
  const activePending = await GateRequest.findOne({
    student: userId,
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (activePending) {
    return res.status(409).json({ message: 'You already have a pending request' });
  }

  // Find the approved gatepass
  const gatepass = await LocalGatepass.findOne({
    _id: gatepassId,
    student: userId,
    status: 'approved',
  });

  if (!gatepass) {
    return res.status(404).json({ message: 'Approved gatepass not found' });
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const requestDoc = await GateRequest.create({
    student: userId,
    direction: 'exit',
    purpose: `Gatepass: ${gatepass.place}`,
    place: gatepass.place,
    tokenHash,
    expiresAt,
    gatePassNo: gatepass.gatePassNo, // Link gatepass number to request
  });

  // QR contains token + gatepass number (separated by pipe)
  const qrData = `${rawToken}|GP:${gatepass.gatePassNo}`;
  const qrDataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 8,
  });

  return res.status(201).json({
    requestId: requestDoc._id,
    token: rawToken,
    expiresAt,
    qrDataUrl,
    direction: 'exit',
    gatePassNo: gatepass.gatePassNo,
  });
};
