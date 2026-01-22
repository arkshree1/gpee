const fs = require('fs');
const path = require('path');
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
    consent,
  } = req.body;

  if (
    !studentName ||
    !rollnumber ||
    !roomNumber ||
    !course ||
    !department ||
    !contact ||
    !dateOut ||
    !timeOut ||
    !dateIn ||
    !timeIn ||
    !address ||
    !natureOfLeave ||
    !reasonOfLeave
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

  // Calculate leaveDays from dateOut and dateIn
  const outDate = new Date(dateOut);
  const inDate = new Date(dateIn);
  const diffTime = inDate.getTime() - outDate.getTime();
  const calculatedLeaveDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Handle proof file upload
  const proofFile = req.file ? `/uploads/OS_GatePass_Proofs/${req.file.filename}` : null;

  const doc = await OutstationGatepass.create({
    student: studentId,
    studentName,
    rollnumber,
    roomNumber,
    course,
    department,
    branch,
    contact,
    leaveDays: calculatedLeaveDays,
    dateOut,
    timeOut,
    dateIn,
    timeIn,
    address,
    natureOfLeave,
    reasonOfLeave,
    proofFile,
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

exports.deleteOutstationGatepass = async (req, res) => {
  const studentId = req.user.userId;
  const { gatepassId } = req.params;

  if (!gatepassId) {
    return res.status(400).json({ message: 'Gatepass ID is required' });
  }

  const gatepass = await OutstationGatepass.findOne({ _id: gatepassId, student: studentId });
  if (!gatepass) {
    return res.status(404).json({ message: 'Gatepass not found' });
  }

  if (gatepass.finalStatus !== 'pending' || gatepass.utilizationStatus !== 'pending') {
    return res.status(400).json({ message: 'Only pending gatepasses can be withdrawn.' });
  }

  if (gatepass.proofFile) {
    const proofPath = path.join(__dirname, '..', gatepass.proofFile);
    fs.unlink(proofPath, () => {});
  }

  await gatepass.deleteOne();

  return res.json({ message: 'Outstation gatepass withdrawn successfully.' });
};
