const fs = require('fs');
const path = require('path');
const OutstationGatepass = require('../models/OutstationGatepass');
const GateRequest = require('../models/GateRequest');
const OfficeSecretary = require('../models/OfficeSecretary');
const Faculty = require('../models/Faculty');
const { sendOutstationGatepassNotification } = require('../utils/emailService');

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
    classesMissed,
    instructorId,
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

  // PhD students must select an instructor
  if (course === 'PhD' && !instructorId) {
    return res.status(400).json({ message: 'PhD students must select an instructor' });
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

  // PhD students start at instructor stage, others start at officeSecretary
  const initialStage = course === 'PhD' ? 'instructor' : 'officeSecretary';

  // Get instructor details for PhD students
  let instructorName = null;
  if (course === 'PhD' && instructorId) {
    const instructor = await Faculty.findById(instructorId).select('name');
    if (instructor) {
      instructorName = instructor.name;
    }
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
    // classesMissed will be filled by Office Secretary, not student
    classesMissed: null,
    missedDays: 0,
    currentStage: initialStage,
    instructor: course === 'PhD' ? instructorId : undefined,
    instructorName: instructorName,
  });

  // Send email notification based on course type
  try {
    if (course === 'PhD' && instructorId) {
      // PhD: Send email to instructor
      const instructor = await Faculty.findById(instructorId).select('name email');
      if (instructor && instructor.email) {
        const reviewLink = `${process.env.FRONTEND_URL || 'https://gothru.vercel.app'}/faculty/outstation`;
        await sendOutstationGatepassNotification({
          to: instructor.email,
          approverName: instructor.name,
          approverRole: 'Instructor',
          studentName,
          rollnumber,
          department,
          branch,
          roomNumber,
          contact,
          reasonOfLeave,
          address,
          dateOut,
          dateIn,
          classesMissed: classesMissed || 0,
          missedDays: calculatedLeaveDays,
          forwardedBy: null,
          reviewLink,
        });
      }
    } else {
      // BTech/MBA: Send email to Office Secretary
      const officeSecretary = await OfficeSecretary.findOne({ department }).select('name email');
      if (officeSecretary && officeSecretary.email) {
        const reviewLink = `${process.env.FRONTEND_URL || 'https://gothru.vercel.app'}/office-secretary/outstation`;
        await sendOutstationGatepassNotification({
          to: officeSecretary.email,
          approverName: officeSecretary.name,
          approverRole: 'Office Secretary',
          studentName,
          rollnumber,
          department,
          branch,
          roomNumber,
          contact,
          reasonOfLeave,
          address,
          dateOut,
          dateIn,
          classesMissed: classesMissed || 0,
          missedDays: calculatedLeaveDays,
          forwardedBy: null,
          reviewLink,
        });
      }
    }
  } catch (emailErr) {
    console.error('Failed to send email notification:', emailErr);
    // Don't fail the request if email fails
  }

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

  // Check for recently rejected request (within last 30 seconds) for outstation gatepass QR
  const recentRejection = await GateRequest.findOne({
    student: studentId,
    status: 'rejected',
    decidedAt: { $gte: new Date(Date.now() - 30000) },
    gatePassNo: { $exists: true, $ne: null, $regex: /^OS-/ }, // Outstation gatepass only
  }).select('_id direction decidedAt gatePassNo').sort({ decidedAt: -1 });

  let showRejection = null;
  if (recentRejection) {
    const approvedAfterRejection = await GateRequest.findOne({
      student: studentId,
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
    OSActiveGPNo: student?.OSActiveGPNo || null,
    recentRejection: showRejection,
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
    fs.unlink(proofPath, () => { });
  }

  await gatepass.deleteOne();

  return res.json({ message: 'Outstation gatepass withdrawn successfully.' });
};
