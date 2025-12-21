const User = require('../models/User');
const Guard = require('../models/Guard');
const GateRequest = require('../models/GateRequest');
const GateLog = require('../models/GateLog');
const { hashToken } = require('../utils/security');

const computeNewPresence = (currentPresence, direction) => {
  // direction: exit => inside->outside
  // direction: entry => outside->inside
  if (direction === 'exit') return 'outside';
  return 'inside';
};

exports.scanToken = async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ message: 'Token is required' });

  const tokenHash = hashToken(token);

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

  // Security rule: only authenticated guard gets student details.
  return res.json({
    requestId: requestDoc._id,
    direction: requestDoc.direction,
    purpose: requestDoc.purpose,
    place: requestDoc.place,
    expiresAt: requestDoc.expiresAt,
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
    } else if (requestDoc.direction === 'entry') {
      student.outPurpose = null;
      student.outPlace = null;
      student.outTime = null;
    }
    await student.save();
  }

  // Logging rules (immutable-style audit trail):
  // 1) EXIT DENIED     -> NEW document
  // 2) EXIT APPROVED   -> NEW document (base exit document)
  // 3) ENTRY DENIED    -> NEW document
  // 4) ENTRY APPROVED  -> MODIFY ONLY the latest exit-approved document for this student

  if (requestDoc.direction === 'exit') {
    if (approved) {
      // EXIT APPROVED -> base exit document
      await GateLog.create({
        student: student._id,
        guard: guard._id,
        request: requestDoc._id,
        direction: 'exit',
        outcome: 'approved',
        purpose: requestDoc.purpose,
        place: requestDoc.place,
        decidedAt,
        exitStatus: 'exit done',
        exitOutcome: 'approved',
        entryStatus: '--',
        entryOutcome: '--',
        exitStatusTime: decidedAt,
        entryStatusTime: null,
      });
    } else {
      // EXIT DENIED -> new immutable document
      await GateLog.create({
        student: student._id,
        guard: guard._id,
        request: requestDoc._id,
        direction: 'exit',
        outcome: 'denied',
        purpose: requestDoc.purpose,
        place: requestDoc.place,
        decidedAt,
        exitStatus: 'exit denied',
        exitOutcome: 'denied',
        entryStatus: '--',
        entryOutcome: '--',
        exitStatusTime: decidedAt,
        entryStatusTime: null,
      });
    }
  } else if (requestDoc.direction === 'entry') {
    // Find latest approved exit log for this student (base document)
    const baseExitLog = await GateLog.findOne({
      student: student._id,
      direction: 'exit',
      exitOutcome: 'approved',
    }).sort({ exitStatusTime: -1 });

    if (approved) {
      // ENTRY APPROVED -> modify only the base exit-approved document
      if (baseExitLog) {
        baseExitLog.entryStatus = 'entry approved';
        baseExitLog.entryOutcome = 'approved';
        baseExitLog.entryStatusTime = decidedAt;
        baseExitLog.decidedAt = decidedAt;
        baseExitLog.outcome = 'approved';
        await baseExitLog.save();
      } else {
        // Fallback: if no base exit log found, create a standalone entry-approved log
        await GateLog.create({
          student: student._id,
          guard: guard._id,
          request: requestDoc._id,
          direction: 'entry',
          outcome: 'approved',
          purpose: requestDoc.purpose,
          place: requestDoc.place,
          decidedAt,
          exitStatus: '--',
          exitOutcome: '--',
          entryStatus: 'entry approved',
          entryOutcome: 'approved',
          exitStatusTime: null,
          entryStatusTime: decidedAt,
        });
      }
    } else {
      // ENTRY DENIED -> new immutable document
      let exitStatus = '--';
      let exitOutcome = '--';
      let exitStatusTime = null;

      if (baseExitLog) {
        exitStatus = baseExitLog.exitStatus;
        exitOutcome = baseExitLog.exitOutcome;
        exitStatusTime = baseExitLog.exitStatusTime;
      } else if (student.outTime) {
        // Fallback if base log missing but we know student went out
        exitStatus = 'exit done';
        exitOutcome = 'approved';
        exitStatusTime = student.outTime;
      }

      await GateLog.create({
        student: student._id,
        guard: guard._id,
        request: requestDoc._id,
        direction: 'entry',
        outcome: 'denied',
        purpose: requestDoc.purpose,
        place: requestDoc.place,
        decidedAt,
        exitStatus,
        exitOutcome,
        entryStatus: 'entry denied',
        entryOutcome: 'denied',
        exitStatusTime,
        entryStatusTime: decidedAt,
      });
    }
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
