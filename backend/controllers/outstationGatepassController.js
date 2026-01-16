const OutstationGatepass = require('../models/OutstationGatepass');

exports.createOutstationGatepass = async (req, res) => {
  const studentId = req.user.userId;
  const {
    studentName,
    rollnumber,
    roomNumber,
    course,
    department,
    branch,
    contact,
    leaveDays,
    dateOut,
    timeOut,
    dateIn,
    timeIn,
    address,
    natureOfLeave,
    reasonOfLeave,
    classesMissed,
    missedDays,
    consent,
  } = req.body;

  if (
    !studentName ||
    !rollnumber ||
    !roomNumber ||
    !course ||
    !department ||
    !contact ||
    !leaveDays ||
    !dateOut ||
    !timeOut ||
    !dateIn ||
    !timeIn ||
    !address ||
    !natureOfLeave ||
    !reasonOfLeave ||
    !classesMissed ||
    missedDays === undefined
  ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!consent) {
    return res
      .status(400)
      .json({ message: 'You must confirm that the information is correct.' });
  }

  if (!/^\d{10}$/.test(contact)) {
    return res.status(400).json({ message: 'Contact number must be 10 digits.' });
  }

  const parsedLeaveDays = Number(leaveDays);
  const parsedMissedDays = Number(missedDays);

  if (Number.isNaN(parsedLeaveDays) || parsedLeaveDays < 1) {
    return res.status(400).json({ message: 'No. of leave days must be at least 1.' });
  }

  if (Number.isNaN(parsedMissedDays) || parsedMissedDays < 0) {
    return res.status(400).json({ message: 'No. of days classes missed cannot be negative.' });
  }

  if (!['yes', 'no'].includes(classesMissed)) {
    return res.status(400).json({ message: 'classesMissed must be yes or no.' });
  }

  const doc = await OutstationGatepass.create({
    student: studentId,
    studentName,
    rollnumber,
    roomNumber,
    course,
    department,
    branch,
    contact,
    leaveDays: parsedLeaveDays,
    dateOut,
    timeOut,
    dateIn,
    timeIn,
    address,
    natureOfLeave,
    reasonOfLeave,
    classesMissed,
    missedDays: parsedMissedDays,
    consent: !!consent,
  });

  return res
    .status(201)
    .json({ message: 'Outstation gatepass submitted successfully', gatepassId: doc._id });
};

// Get student's outstation gatepasses for tracking
const User = require('../models/User');

exports.getMyOutstationGatepasses = async (req, res) => {
  const studentId = req.user.userId;

  const student = await User.findById(studentId).select('presence OSActiveGPNo');

  const gatepasses = await OutstationGatepass.find({ student: studentId })
    .sort({ createdAt: -1 })
    .select('-__v');

  return res.json({
    gatepasses,
    presence: student?.presence || 'inside',
    OSActiveGPNo: student?.OSActiveGPNo || null,
  });
};
