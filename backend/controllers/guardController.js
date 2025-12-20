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

  // Logging: one GateLog per full visit. Exit approves create a log with exitTime.
  // Entry approves fill in entryTime on the latest open log for that student.
  if (approved) {
    if (requestDoc.direction === 'exit') {
      await GateLog.create({
        student: student._id,
        guard: guard._id,
        request: requestDoc._id,
        direction: requestDoc.direction,
        outcome: 'approved',
        purpose: requestDoc.purpose,
        place: requestDoc.place,
        decidedAt,
        exitTime: decidedAt,
        entryTime: null,
      });
    } else if (requestDoc.direction === 'entry') {
      const openLog = await GateLog.findOne({
        student: student._id,
        outcome: 'approved',
        entryTime: null,
      }).sort({ decidedAt: -1 });

      if (openLog) {
        openLog.entryTime = decidedAt;
        await openLog.save();
      } else {
        // Fallback: create a standalone entry log if no open exit log exists.
        await GateLog.create({
          student: student._id,
          guard: guard._id,
          request: requestDoc._id,
          direction: requestDoc.direction,
          outcome: 'approved',
          purpose: requestDoc.purpose,
          place: requestDoc.place,
          decidedAt,
          exitTime: null,
          entryTime: decidedAt,
        });
      }
    }
  } else {
    // Still log rejections as individual events.
    await GateLog.create({
      student: student._id,
      guard: guard._id,
      request: requestDoc._id,
      direction: requestDoc.direction,
      outcome: 'rejected',
      purpose: requestDoc.purpose,
      place: requestDoc.place,
      decidedAt,
      exitTime: requestDoc.direction === 'exit' ? decidedAt : null,
      entryTime: requestDoc.direction === 'entry' ? decidedAt : null,
    });
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

  const rejected = await GateLog.find({ outcome: 'rejected' })
    .sort({ decidedAt: -1 })
    .limit(50)
    .populate('student', 'name rollnumber');

  return res.json({ logs, outside, rejected });
};
