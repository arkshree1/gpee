const QRCode = require('qrcode');
const User = require('../models/User');
const GateRequest = require('../models/GateRequest');
const OutstationGatepass = require('../models/OutstationGatepass');
const { generateRawToken, hashToken } = require('../utils/security');

const TOKEN_TTL_MS = 5 * 60 * 1000;

const getDirectionFromPresence = (presence) => {
  // If student is inside campus => they can request exit.
  // If outside => they can request entry.
  return presence === 'inside' ? 'exit' : 'entry';
};

exports.getStatus = async (req, res) => {
  const userId = req.user.userId;

  const student = await User.findById(userId).select('presence role name rollnumber imageUrl department branch course roomNumber contactNumber hostelName localActiveGPNo OSActiveGPNo');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const pendingRequest = await GateRequest.findOne({
    student: userId,
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).select('_id direction purpose place expiresAt createdAt');

  // Check for recently rejected request (within last 30 seconds)
  // Only show rejection if there's no approved request after it
  const recentRejection = await GateRequest.findOne({
    student: userId,
    status: 'rejected',
    decidedAt: { $gte: new Date(Date.now() - 30000) }, // Last 30 seconds
  }).select('_id direction decidedAt').sort({ decidedAt: -1 });

  // Check if there's an approved request after the rejection
  let showRejection = null;
  if (recentRejection) {
    const approvedAfterRejection = await GateRequest.findOne({
      student: userId,
      status: 'approved',
      decidedAt: { $gt: recentRejection.decidedAt },
    });
    // Only show rejection if no approved request came after it
    if (!approvedAfterRejection) {
      showRejection = {
        direction: recentRejection.direction,
        decidedAt: recentRejection.decidedAt,
      };
    }
  }

  // Determine active gatepass number (OS takes priority)
  const activeGatePassNo = student.OSActiveGPNo || student.localActiveGPNo || null;

  return res.json({
    presence: student.presence,
    nextAction: getDirectionFromPresence(student.presence),
    hasPendingRequest: !!pendingRequest,
    pendingRequest,
    // Recent rejection info for UI feedback (only if no approval after)
    recentRejection: showRejection,
    // Active gatepass info
    activeGatePassNo,
    // Student profile data for forms
    studentName: student.name,
    rollnumber: student.rollnumber,
    department: student.department,
    branch: student.branch,
    course: student.course,
    roomNumber: student.roomNumber,
    contactNumber: student.contactNumber,
    hostelName: student.hostelName,
    imageUrl: student.imageUrl,
  });
};

exports.apply = async (req, res) => {
  const userId = req.user.userId;
  const { purpose, place } = req.body;

  const student = await User.findById(userId).select('presence role outPurpose outPlace outTime localActiveGPNo OSActiveGPNo');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Check if there's an active pending request - if so, regenerate QR for it
  const activePending = await GateRequest.findOne({
    student: userId,
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (activePending) {
    // Regenerate QR for existing pending request
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const newExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    activePending.tokenHash = tokenHash;
    activePending.expiresAt = newExpiresAt;
    await activePending.save();

    // Generate QR with gatepass number if applicable
    let qrData = rawToken;
    if (activePending.gatePassNo) {
      qrData = `${rawToken}|GP:${activePending.gatePassNo}`;
    }

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 8,
    });

    return res.status(200).json({
      requestId: activePending._id,
      token: rawToken,
      expiresAt: newExpiresAt,
      qrDataUrl,
      direction: activePending.direction,
      gatePassNo: activePending.gatePassNo || null,
      reused: true,
    });
  }

  const direction = getDirectionFromPresence(student.presence);

  let effectivePurpose = purpose;
  let effectivePlace = place;

  // Gatepass-related fields (will be populated if student has active gatepass)
  let gatePassNo = null;
  let gatepassId = null;
  let gatepassOutTime = null;
  let gatepassInTime = null;
  let isOutstation = false;

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

    // Check if student has an active outstation gatepass - if so, include gatepass info
    if (student.OSActiveGPNo) {
      const osGatepass = await OutstationGatepass.findOne({ gatePassNo: student.OSActiveGPNo });
      if (osGatepass) {
        gatePassNo = osGatepass.gatePassNo;
        gatepassId = osGatepass._id;
        gatepassOutTime = osGatepass.dateOut && osGatepass.timeOut
          ? `${osGatepass.dateOut}T${osGatepass.timeOut}`
          : null;
        gatepassInTime = osGatepass.dateIn && osGatepass.timeIn
          ? `${osGatepass.dateIn}T${osGatepass.timeIn}`
          : null;
        isOutstation = true;
        // Use gatepass purpose/place if available
        effectivePurpose = osGatepass.reasonOfLeave || effectivePurpose;
        effectivePlace = osGatepass.address || effectivePlace;
      }
    }
    // Check if student has an active local gatepass - if so, include gatepass info
    else if (student.localActiveGPNo) {
      const gatepass = await LocalGatepass.findOne({ gatePassNo: student.localActiveGPNo });
      if (gatepass) {
        gatePassNo = gatepass.gatePassNo;
        gatepassId = gatepass._id;
        gatepassOutTime = gatepass.dateOut && gatepass.timeOut
          ? `${gatepass.dateOut}T${gatepass.timeOut}`
          : null;
        gatepassInTime = gatepass.dateIn && gatepass.timeIn
          ? `${gatepass.dateIn}T${gatepass.timeIn}`
          : null;
        // Use gatepass purpose/place if available
        effectivePurpose = gatepass.purpose || effectivePurpose;
        effectivePlace = gatepass.place || effectivePlace;
      }
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
    gatePassNo,
    gatepassId,
    gatepassOutTime,
    gatepassInTime,
    isOutstation,
  });

  // QR contains token + gatepass number if applicable
  let qrData = rawToken;
  if (gatePassNo) {
    qrData = `${rawToken}|GP:${gatePassNo}`;
  }

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
    direction,
    gatePassNo,
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

  const student = await User.findById(userId).select('presence localActiveGPNo');

  const gatepasses = await LocalGatepass.find({ student: userId })
    .sort({ createdAt: -1 })
    .select('-__v');

  // Check for recently rejected request (within last 30 seconds) for gatepass QR
  const recentRejection = await GateRequest.findOne({
    student: userId,
    status: 'rejected',
    decidedAt: { $gte: new Date(Date.now() - 30000) },
    gatePassNo: { $exists: true, $ne: null, $regex: /^L-/ }, // Local gatepass only
  }).select('_id direction decidedAt gatePassNo').sort({ decidedAt: -1 });

  let showRejection = null;
  if (recentRejection) {
    const approvedAfterRejection = await GateRequest.findOne({
      student: userId,
      status: 'approved',
      decidedAt: { $gt: recentRejection.decidedAt },
    });
    if (!approvedAfterRejection) {
      showRejection = {
        direction: recentRejection.direction,
        decidedAt: recentRejection.decidedAt,
        gatePassNo: recentRejection.gatePassNo,
      };
    }
  }

  return res.json({
    gatepasses,
    presence: student?.presence || 'inside',
    localActiveGPNo: student?.localActiveGPNo || null,
    recentRejection: showRejection,
  });
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

  // Check for existing pending request - if exists, regenerate QR for it
  const activePending = await GateRequest.findOne({
    student: userId,
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (activePending) {
    // Regenerate QR for existing pending request
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const newExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    // Update the existing request with new token
    activePending.tokenHash = tokenHash;
    activePending.expiresAt = newExpiresAt;
    await activePending.save();

    // Generate QR with gatepass number if applicable
    let qrData = rawToken;
    if (activePending.gatePassNo) {
      qrData = `${rawToken}|GP:${activePending.gatePassNo}`;
    }

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 8,
    });

    return res.status(200).json({
      requestId: activePending._id,
      token: rawToken,
      expiresAt: newExpiresAt,
      qrDataUrl,
      direction: activePending.direction,
      gatePassNo: activePending.gatePassNo,
      reused: true,
    });
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

  // Check 15-minute before exit time restriction
  if (gatepass.dateOut && gatepass.timeOut) {
    try {
      const exitDate = new Date(gatepass.dateOut);
      const timeParts = gatepass.timeOut.split(':');
      exitDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
      
      // Calculate 15 minutes before scheduled exit
      const allowedTime = new Date(exitDate.getTime() - 15 * 60 * 1000);
      
      if (Date.now() < allowedTime.getTime()) {
        // Format available time for error message
        let hours = allowedTime.getHours();
        const mins = String(allowedTime.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const availableAt = `${hours}:${mins} ${ampm}`;
        
        return res.status(400).json({
          message: `Exit QR can only be generated 15 minutes before your scheduled exit time. Available at ${availableAt}`,
          code: 'EXIT_TIME_RESTRICTION',
          availableAt,
        });
      }
    } catch (err) {
      // If date parsing fails, allow the request
      console.error('Failed to parse gatepass exit time:', err);
    }
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Combine date and time for scheduled times
  const gatepassOutTime = gatepass.dateOut && gatepass.timeOut
    ? `${gatepass.dateOut}T${gatepass.timeOut}`
    : null;
  const gatepassInTime = gatepass.dateIn && gatepass.timeIn
    ? `${gatepass.dateIn}T${gatepass.timeIn}`
    : null;

  const requestDoc = await GateRequest.create({
    student: userId,
    direction: 'exit',
    purpose: gatepass.purpose,
    place: gatepass.place,
    tokenHash,
    expiresAt,
    gatePassNo: gatepass.gatePassNo,
    // Gatepass-specific fields
    gatepassId: gatepass._id,
    gatepassOutTime,
    gatepassInTime,
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

// Generate QR for gatepass entry (when student is outside with active gatepass)
exports.applyGatepassEntry = async (req, res) => {
  const userId = req.user.userId;
  const { gatepassId } = req.body;

  if (!gatepassId) {
    return res.status(400).json({ message: 'Gatepass ID is required' });
  }

  const student = await User.findById(userId).select('presence localActiveGPNo outPurpose outPlace outTime');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  if (student.presence !== 'outside') {
    return res.status(400).json({ message: 'You are already inside campus' });
  }

  // Check for existing pending request - if exists, regenerate QR for it
  const activePending = await GateRequest.findOne({
    student: userId,
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (activePending) {
    // Regenerate QR for existing pending request
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const newExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    // Update the existing request with new token
    activePending.tokenHash = tokenHash;
    activePending.expiresAt = newExpiresAt;
    await activePending.save();

    // Generate QR with gatepass number if applicable
    let qrData = rawToken;
    if (activePending.gatePassNo) {
      qrData = `${rawToken}|GP:${activePending.gatePassNo}`;
    }

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 8,
    });

    return res.status(200).json({
      requestId: activePending._id,
      token: rawToken,
      expiresAt: newExpiresAt,
      qrDataUrl,
      direction: activePending.direction,
      gatePassNo: activePending.gatePassNo,
      reused: true,
    });
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

  // Verify this is the active gatepass the student used to exit
  if (student.localActiveGPNo !== gatepass.gatePassNo) {
    return res.status(400).json({ message: 'This is not your active gatepass for entry' });
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Combine date and time for scheduled times
  const gatepassOutTime = gatepass.dateOut && gatepass.timeOut
    ? `${gatepass.dateOut}T${gatepass.timeOut}`
    : null;
  const gatepassInTime = gatepass.dateIn && gatepass.timeIn
    ? `${gatepass.dateIn}T${gatepass.timeIn}`
    : null;

  const requestDoc = await GateRequest.create({
    student: userId,
    direction: 'entry',
    purpose: student.outPurpose || gatepass.purpose,
    place: student.outPlace || gatepass.place,
    tokenHash,
    expiresAt,
    gatePassNo: gatepass.gatePassNo,
    // Gatepass-specific fields
    gatepassId: gatepass._id,
    gatepassOutTime,
    gatepassInTime,
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
    direction: 'entry',
    gatePassNo: gatepass.gatePassNo,
  });
};

// Outstation Gatepass QR functions

// Generate QR for outstation gatepass exit
exports.applyOSGatepassExit = async (req, res) => {
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

  // Check for existing pending request - if exists, regenerate QR for it
  const activePending = await GateRequest.findOne({
    student: userId,
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (activePending) {
    // Regenerate QR for existing pending request
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const newExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    activePending.tokenHash = tokenHash;
    activePending.expiresAt = newExpiresAt;
    await activePending.save();

    let qrData = rawToken;
    if (activePending.gatePassNo) {
      qrData = `${rawToken}|GP:${activePending.gatePassNo}`;
    }

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 8,
    });

    return res.status(200).json({
      requestId: activePending._id,
      token: rawToken,
      expiresAt: newExpiresAt,
      qrDataUrl,
      direction: activePending.direction,
      gatePassNo: activePending.gatePassNo,
      reused: true,
    });
  }

  // Find the approved outstation gatepass
  const gatepass = await OutstationGatepass.findOne({
    _id: gatepassId,
    student: userId,
    finalStatus: 'approved',
  });

  if (!gatepass) {
    return res.status(404).json({ message: 'Approved outstation gatepass not found' });
  }

  // Check if in-time has passed (exit not allowed after in-time)
  const inDateTime = new Date(`${gatepass.dateIn}T${gatepass.timeIn}`);
  if (Date.now() > inDateTime.getTime()) {
    return res.status(400).json({ message: 'Gatepass has expired - in-time has passed' });
  }

  // Check if already utilized
  if (gatepass.utilized) {
    return res.status(400).json({ message: 'Gatepass has already been utilized' });
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const gatepassOutTime = `${gatepass.dateOut}T${gatepass.timeOut}`;
  const gatepassInTime = `${gatepass.dateIn}T${gatepass.timeIn}`;

  const requestDoc = await GateRequest.create({
    student: userId,
    direction: 'exit',
    purpose: gatepass.reasonOfLeave,
    place: gatepass.address,
    tokenHash,
    expiresAt,
    gatePassNo: gatepass.gatePassNo,
    gatepassId: gatepass._id,
    gatepassOutTime,
    gatepassInTime,
    isOutstation: true, // Flag for guard to know this is OS gatepass
  });

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

// Generate QR for outstation gatepass entry (when student is outside)
exports.applyOSGatepassEntry = async (req, res) => {
  const userId = req.user.userId;
  const { gatepassId } = req.body;

  if (!gatepassId) {
    return res.status(400).json({ message: 'Gatepass ID is required' });
  }

  const student = await User.findById(userId).select('presence OSActiveGPNo outPurpose outPlace');
  if (!student) return res.status(404).json({ message: 'Student not found' });

  if (student.presence !== 'outside') {
    return res.status(400).json({ message: 'You are already inside campus' });
  }

  // Check for existing pending request
  const activePending = await GateRequest.findOne({
    student: userId,
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (activePending) {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const newExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    activePending.tokenHash = tokenHash;
    activePending.expiresAt = newExpiresAt;
    await activePending.save();

    let qrData = rawToken;
    if (activePending.gatePassNo) {
      qrData = `${rawToken}|GP:${activePending.gatePassNo}`;
    }

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 8,
    });

    return res.status(200).json({
      requestId: activePending._id,
      token: rawToken,
      expiresAt: newExpiresAt,
      qrDataUrl,
      direction: activePending.direction,
      gatePassNo: activePending.gatePassNo,
      reused: true,
    });
  }

  // Find the approved outstation gatepass
  const gatepass = await OutstationGatepass.findOne({
    _id: gatepassId,
    student: userId,
    finalStatus: 'approved',
  });

  if (!gatepass) {
    return res.status(404).json({ message: 'Approved outstation gatepass not found' });
  }

  // Verify this is the active gatepass
  if (student.OSActiveGPNo !== gatepass.gatePassNo) {
    return res.status(400).json({ message: 'This is not your active gatepass for entry' });
  }

  // No time restriction for entry - student can enter even after in-time passed

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const gatepassOutTime = `${gatepass.dateOut}T${gatepass.timeOut}`;
  const gatepassInTime = `${gatepass.dateIn}T${gatepass.timeIn}`;

  const requestDoc = await GateRequest.create({
    student: userId,
    direction: 'entry',
    purpose: student.outPurpose || gatepass.reasonOfLeave,
    place: student.outPlace || gatepass.address,
    tokenHash,
    expiresAt,
    gatePassNo: gatepass.gatePassNo,
    gatepassId: gatepass._id,
    gatepassOutTime,
    gatepassInTime,
    isOutstation: true,
  });

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
    direction: 'entry',
    gatePassNo: gatepass.gatePassNo,
  });
};

