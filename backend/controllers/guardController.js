const User = require('../models/User');
const Guard = require('../models/Guard');
const GateRequest = require('../models/GateRequest');
const GateLog = require('../models/GateLog');
const { hashToken } = require('../utils/security');
const { emitGateDecision, emitActivityUpdate } = require('../utils/socket');

const computeNewPresence = (currentPresence, direction) => {
  // direction: exit => inside->outside
  // direction: entry => outside->inside
  if (direction === 'exit') return 'outside';
  return 'inside';
};

exports.scanToken = async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ message: 'Token is required' });

  // Check if token contains gatepass info (format: token|GP:L-XXXXX)
  let actualToken = token;
  let gatePassNo = null;

  if (token.includes('|GP:')) {
    const parts = token.split('|GP:');
    actualToken = parts[0];
    gatePassNo = parts[1];
  }

  const tokenHash = hashToken(actualToken);

  const requestDoc = await GateRequest.findOne({ tokenHash }).populate(
    'student',
    'name rollnumber imageUrl presence outPurpose outPlace outTime'
  );

  if (!requestDoc) return res.status(404).json({ message: 'Invalid token' });
  if (requestDoc.usedAt) return res.status(410).json({ message: 'Token already used' });
  if (requestDoc.expiresAt <= new Date()) return res.status(410).json({ message: 'Token expired' });
  if (requestDoc.status !== 'pending') return res.status(409).json({ message: 'Request is not pending' });

  const student = requestDoc.student;
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Check if this is a gatepass-related request
  const isGatepassExit = !!(requestDoc.gatepassId || requestDoc.gatePassNo);

  // Build gatepass details from the GateRequest (preferred) or fetch from LocalGatepass
  let gatepassDetails = null;
  const effectiveGatePassNo = gatePassNo || requestDoc.gatePassNo;

  if (isGatepassExit) {
    // First try to use data stored in GateRequest
    if (requestDoc.gatepassOutTime || requestDoc.gatepassInTime) {
      gatepassDetails = {
        gatePassNo: effectiveGatePassNo,
        gatepassOutTime: requestDoc.gatepassOutTime,
        gatepassInTime: requestDoc.gatepassInTime,
        place: requestDoc.place,
        purpose: requestDoc.purpose,
        isOutstation: requestDoc.isOutstation || effectiveGatePassNo?.startsWith('OS-'),
      };
    } else if (effectiveGatePassNo) {
      // Fallback: fetch from appropriate gatepass model based on prefix
      if (effectiveGatePassNo.startsWith('OS-')) {
        // Outstation gatepass
        const OutstationGatepass = require('../models/OutstationGatepass');
        const gatepass = await OutstationGatepass.findOne({ gatePassNo: effectiveGatePassNo });
        if (gatepass) {
          gatepassDetails = {
            gatePassNo: gatepass.gatePassNo,
            gatepassOutTime: `${gatepass.dateOut}T${gatepass.timeOut}`,
            gatepassInTime: `${gatepass.dateIn}T${gatepass.timeIn}`,
            place: gatepass.address,
            purpose: gatepass.reasonOfLeave,
            isOutstation: true,
          };
        }
      } else {
        // Local gatepass
        const LocalGatepass = require('../models/LocalGatepass');
        const gatepass = await LocalGatepass.findOne({ gatePassNo: effectiveGatePassNo });
        if (gatepass) {
          gatepassDetails = {
            gatePassNo: gatepass.gatePassNo,
            gatepassOutTime: gatepass.dateOut && gatepass.timeOut
              ? `${gatepass.dateOut}T${gatepass.timeOut}`
              : null,
            gatepassInTime: gatepass.dateIn && gatepass.timeIn
              ? `${gatepass.dateIn}T${gatepass.timeIn}`
              : null,
            place: gatepass.place,
            purpose: gatepass.purpose,
            isOutstation: false,
          };
        }
      }
    }
  }

  // Security rule: only authenticated guard gets student details.
  return res.json({
    requestId: requestDoc._id,
    direction: requestDoc.direction,
    purpose: requestDoc.purpose,
    place: requestDoc.place,
    expiresAt: requestDoc.expiresAt,
    gatePassNo: effectiveGatePassNo || null,
    isGatepassExit,
    gatepassDetails,
    student: {
      id: student._id,
      name: student.name,
      rollnumber: student.rollnumber,
      imageUrl: student.imageUrl,
      presence: student.presence,
      outPurpose: student.outPurpose,
      outPlace: student.outPlace,
      outTime: student.outTime,
    },
  });
};

exports.decide = async (req, res) => {
  const guardId = req.user.userId;
  const { requestId, decision } = req.body;

  if (!requestId || !decision) {
    return res.status(400).json({ message: 'requestId and decision are required' });
  }
  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be approve or reject' });
  }

  const requestDoc = await GateRequest.findById(requestId);
  if (!requestDoc) return res.status(404).json({ message: 'Request not found' });

  if (requestDoc.usedAt) return res.status(410).json({ message: 'Token already used' });
  if (requestDoc.expiresAt <= new Date()) {
    // Mark used so it can't be replayed.
    requestDoc.usedAt = new Date();
    requestDoc.status = 'rejected';
    requestDoc.guard = guardId;
    requestDoc.decidedAt = new Date();
    await requestDoc.save();
    return res.status(410).json({ message: 'Token expired' });
  }

  const approved = decision === 'approve';

  // Ensure guard exists (guard tokens must come from Guard login)
  const guard = await Guard.findById(guardId).select('name email');
  if (!guard) {
    return res.status(401).json({ message: 'Invalid guard session' });
  }

  requestDoc.usedAt = new Date();
  requestDoc.status = approved ? 'approved' : 'rejected';
  requestDoc.guard = guard._id;
  requestDoc.decidedAt = new Date();
  await requestDoc.save();

  const student = await User.findById(requestDoc.student);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const decidedAt = requestDoc.decidedAt || new Date();

  if (approved) {
    student.presence = computeNewPresence(student.presence, requestDoc.direction);
    if (requestDoc.direction === 'exit') {
      student.outPurpose = requestDoc.purpose;
      student.outPlace = requestDoc.place;
      student.outTime = decidedAt;
      // If this is a gatepass exit, store the gatepass number in the appropriate field
      if (requestDoc.gatePassNo) {
        if (requestDoc.gatePassNo.startsWith('OS-')) {
          student.OSActiveGPNo = requestDoc.gatePassNo;
          // Record the actual exit time for OS gatepass and set status to in_use
          const OutstationGatepass = require('../models/OutstationGatepass');
          await OutstationGatepass.findOneAndUpdate(
            { gatePassNo: requestDoc.gatePassNo },
            { actualExitAt: decidedAt, utilizationStatus: 'in_use' }
          );
        } else if (requestDoc.gatePassNo.startsWith('L-')) {
          student.localActiveGPNo = requestDoc.gatePassNo;
          // Set local gatepass status to in_use and record actual exit time
          const LocalGatepass = require('../models/LocalGatepass');
          await LocalGatepass.findOneAndUpdate(
            { gatePassNo: requestDoc.gatePassNo },
            { actualExitAt: decidedAt, utilizationStatus: 'in_use' }
          );
        }
      }
    } else if (requestDoc.direction === 'entry') {
      // Mark gatepass as utilized if student was using one
      // Check Outstation gatepass
      if (student.OSActiveGPNo) {
        const OutstationGatepass = require('../models/OutstationGatepass');
        await OutstationGatepass.findOneAndUpdate(
          { gatePassNo: student.OSActiveGPNo },
          { utilized: true, actualEntryAt: decidedAt, utilizationStatus: 'completed' }
        );
      }
      // Check Local gatepass
      if (student.localActiveGPNo) {
        const LocalGatepass = require('../models/LocalGatepass');
        await LocalGatepass.findOneAndUpdate(
          { gatePassNo: student.localActiveGPNo },
          { utilized: true, actualEntryAt: decidedAt, utilizationStatus: 'completed' }
        );
      }
      student.outPurpose = null;
      student.outPlace = null;
      student.outTime = null;
      // Clear both gatepass fields on entry
      student.localActiveGPNo = null;
      student.OSActiveGPNo = null;
    }
    await student.save();
  }

  // Logging rules:
  // 1) EXIT DENIED     -> NO log created (student can try again)
  // 2) EXIT APPROVED   -> NEW document (base exit document, status: In Progress)
  // 3) ENTRY DENIED    -> NO log update (base exit log stays as In Progress)
  // 4) ENTRY APPROVED  -> MODIFY the base exit log to mark as Completed

  if (requestDoc.direction === 'exit') {
    if (approved) {
      // EXIT APPROVED -> create base exit document
      await GateLog.create({
        student: student._id,
        guard: guard._id,
        request: requestDoc._id,
        direction: 'exit',
        outcome: 'approved',
        purpose: requestDoc.purpose,
        place: requestDoc.place,
        decidedAt,
        gatepassId: requestDoc.gatepassId || null,
        gatePassNo: requestDoc.gatePassNo || null,
        exitStatus: 'exit done',
        exitOutcome: 'approved',
        entryStatus: '--',
        entryOutcome: '--',
        exitStatusTime: decidedAt,
        entryStatusTime: null,
      });
    }
    // EXIT DENIED -> No log created, student can try again
  } else if (requestDoc.direction === 'entry') {
    // Find latest approved exit log for this student that hasn't been completed yet
    // (entryOutcome must be '--' meaning no entry has been recorded)
    const baseExitLog = await GateLog.findOne({
      student: student._id,
      direction: 'exit',
      exitOutcome: 'approved',
      entryOutcome: '--', // Only find incomplete exit logs
    }).sort({ exitStatusTime: -1 });

    if (approved) {
      // ENTRY APPROVED -> modify the base exit log to mark as Completed
      if (baseExitLog) {
        baseExitLog.entryStatus = 'entry approved';
        baseExitLog.entryOutcome = 'approved';
        baseExitLog.entryStatusTime = decidedAt;
        baseExitLog.decidedAt = decidedAt;
        baseExitLog.outcome = 'approved';
        await baseExitLog.save();
      }

      // ALWAYS create a separate ENTRY log for the activity feed display
      // This ensures both EXIT and ENTRY appear as separate rows in live activity
      await GateLog.create({
        student: student._id,
        guard: guard._id,
        request: requestDoc._id,
        direction: 'entry',
        outcome: 'approved',
        purpose: requestDoc.purpose || baseExitLog?.purpose || '--',
        place: requestDoc.place || baseExitLog?.place || '--',
        decidedAt,
        gatepassId: requestDoc.gatepassId || baseExitLog?.gatepassId || null,
        gatePassNo: requestDoc.gatePassNo || baseExitLog?.gatePassNo || null,
        exitStatus: '--',
        exitOutcome: '--',
        entryStatus: 'entry approved',
        entryOutcome: 'approved',
        exitStatusTime: null,
        entryStatusTime: decidedAt,
      });
    }
    // ENTRY DENIED -> No log update, base exit log stays as In Progress
  }

  // Emit real-time socket event to student
  try {
    emitGateDecision(student._id.toString(), {
      outcome: approved ? 'approved' : 'rejected',
      direction: requestDoc.direction,
      newPresence: student.presence,
      decidedAt: new Date().toISOString(),
      requestId: requestDoc._id.toString(),
    });

    // Also emit activity update for student home screen
    if (approved) {
      emitActivityUpdate(student._id.toString(), {
        type: 'gate-log',
        direction: requestDoc.direction,
        outcome: 'approved',
        decidedAt: new Date().toISOString(),
      });
    }
  } catch (socketErr) {
    // Don't fail the request if socket emit fails
    console.error('Failed to emit socket event:', socketErr.message);
  }

  return res.json({
    message: approved ? 'Approved' : 'Rejected',
    outcome: approved ? 'approved' : 'rejected',
    newPresence: approved ? student.presence : undefined,
  });
};

exports.getDashboard = async (req, res) => {
  const logs = await GateLog.find({})
    .sort({ decidedAt: -1 })
    .limit(50)
    .populate('student', 'name rollnumber')
    .populate('guard', 'name email');

  const outside = await User.find({ role: 'student', presence: 'outside' })
    .select('name rollnumber imageUrl')
    .sort({ rollnumber: 1 })
    .limit(200);

  const rejected = await GateLog.find({ outcome: 'denied' })
    .sort({ decidedAt: -1 })
    .limit(50)
    .populate('student', 'name rollnumber');

  return res.json({ logs, outside, rejected });
};

exports.searchStudents = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ students: [] });

  const regex = new RegExp(q, 'i');

  const students = await User.find({ role: 'student', rollnumber: regex })
    .select('name rollnumber branch roomNumber contactNumber imageUrl presence outPurpose outPlace outTime')
    .limit(10)
    .sort({ rollnumber: 1 });

  return res.json({ students });
};

exports.manualExit = async (req, res) => {
  const guardId = req.user.userId;
  const { studentId, purpose, place } = req.body;

  if (!studentId || !purpose || !place) {
    return res.status(400).json({ message: 'studentId, purpose and place are required' });
  }

  const guard = await Guard.findById(guardId).select('name email');
  if (!guard) {
    return res.status(401).json({ message: 'Invalid guard session' });
  }

  const student = await User.findById(studentId);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  if (student.presence !== 'inside') {
    return res.status(400).json({ message: 'Student is not currently inside' });
  }

  const decidedAt = new Date();

  // Update student presence and out* fields exactly like exit approval via QR
  student.presence = computeNewPresence(student.presence, 'exit');
  student.outPurpose = purpose;
  student.outPlace = place;
  student.outTime = decidedAt;
  await student.save();

  // Create GateLog entry equivalent to an approved exit via QR
  await GateLog.create({
    student: student._id,
    guard: guard._id,
    request: null,
    direction: 'exit',
    outcome: 'approved',
    purpose,
    place,
    decidedAt,
    exitStatus: 'exit done',
    exitOutcome: 'approved',
    entryStatus: '--',
    entryOutcome: '--',
    exitStatusTime: decidedAt,
    entryStatusTime: null,
  });

  return res.json({ message: 'Manual exit recorded successfully' });
};

exports.manualEntry = async (req, res) => {
  const guardId = req.user.userId;
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ message: 'studentId is required' });
  }

  const guard = await Guard.findById(guardId).select('name email');
  if (!guard) {
    return res.status(401).json({ message: 'Invalid guard session' });
  }

  const student = await User.findById(studentId);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  if (student.presence !== 'outside') {
    return res.status(400).json({ message: 'Student is not currently outside' });
  }

  const decidedAt = new Date();

  const purpose = student.outPurpose || undefined;
  const place = student.outPlace || undefined;

  // Mark gatepasses as utilized if student was using one
  if (student.OSActiveGPNo) {
    const OutstationGatepass = require('../models/OutstationGatepass');
    await OutstationGatepass.findOneAndUpdate(
      { gatePassNo: student.OSActiveGPNo },
      { utilized: true, actualEntryAt: decidedAt, utilizationStatus: 'completed' }
    );
  }
  if (student.localActiveGPNo) {
    const LocalGatepass = require('../models/LocalGatepass');
    await LocalGatepass.findOneAndUpdate(
      { gatePassNo: student.localActiveGPNo },
      { utilized: true, utilizationStatus: 'completed' }
    );
  }

  // Update student presence and out* fields exactly like entry approval via QR
  student.presence = computeNewPresence(student.presence, 'entry');
  student.outPurpose = null;
  student.outPlace = null;
  student.outTime = null;
  // Clear both gatepass fields
  student.localActiveGPNo = null;
  student.OSActiveGPNo = null;
  await student.save();

  // Find latest approved exit log for this student that hasn't been completed yet
  const baseExitLog = await GateLog.findOne({
    student: student._id,
    direction: 'exit',
    exitOutcome: 'approved',
    entryOutcome: '--', // Only find incomplete exit logs
  }).sort({ exitStatusTime: -1 });

  if (baseExitLog) {
    // ENTRY APPROVED -> modify only the base exit-approved document
    baseExitLog.entryStatus = 'entry approved';
    baseExitLog.entryOutcome = 'approved';
    baseExitLog.entryStatusTime = decidedAt;
    baseExitLog.decidedAt = decidedAt;
    baseExitLog.outcome = 'approved';
    if (purpose) baseExitLog.purpose = purpose;
    if (place) baseExitLog.place = place;
    await baseExitLog.save();
  } else {
    // Fallback: if no base exit log found, create a standalone entry-approved log
    await GateLog.create({
      student: student._id,
      guard: guard._id,
      request: null,
      direction: 'entry',
      outcome: 'approved',
      purpose: purpose || undefined,
      place: place || undefined,
      decidedAt,
      exitStatus: '--',
      exitOutcome: '--',
      entryStatus: 'entry approved',
      entryOutcome: 'approved',
      exitStatusTime: null,
      entryStatusTime: decidedAt,
    });
  }

  return res.json({ message: 'Manual entry recorded successfully' });
};

exports.getEntryExitLogs = async (req, res) => {
  const logs = await GateLog.find({
    exitOutcome: 'approved',
    entryOutcome: { $in: ['approved', '--'] },
  })
    .sort({ exitStatusTime: 1, _id: 1 })
    .limit(300)
    .populate('student', 'name rollnumber roomNumber contactNumber');

  return res.json({ logs });
};
