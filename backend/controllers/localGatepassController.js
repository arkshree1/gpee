const LocalGatepass = require('../models/LocalGatepass');

// Generate unique gatePassNo in L-XXXXX format
const generateGatePassNo = async () => {
  // Find the last gatepass to get the highest number
  const lastGatepass = await LocalGatepass.findOne({})
    .sort({ createdAt: -1 })
    .select('gatePassNo');

  let nextNumber = 1;

  if (lastGatepass && lastGatepass.gatePassNo) {
    // Extract the number from L-XXXXX format
    const match = lastGatepass.gatePassNo.match(/L-(\d{5})/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Pad to 5 digits
  const paddedNumber = String(nextNumber).padStart(5, '0');
  return `L-${paddedNumber}`;
};

exports.createLocalGatepass = async (req, res) => {
  const studentId = req.user.userId;
  const {
    studentName,
    rollnumber,
    department,
    roomNumber,
    semester,
    dateOut,
    timeOut,
    dateIn,
    timeIn,
    purpose,
    place,
    contact,
    consent,
  } = req.body;

  if (
    !studentName ||
    !rollnumber ||
    !department ||
    !roomNumber ||
    !semester ||
    !dateOut ||
    !timeOut ||
    !dateIn ||
    !timeIn ||
    !purpose ||
    !place ||
    !contact
  ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!consent) {
    return res.status(400).json({ message: 'You must confirm that the information is correct.' });
  }

  if (!/^\d{10}$/.test(contact)) {
    return res.status(400).json({ message: 'Contact number must be 10 digits.' });
  }

  // Generate unique gatePassNo
  const gatePassNo = await generateGatePassNo();

  const doc = await LocalGatepass.create({
    gatePassNo,
    student: studentId,
    studentName,
    rollnumber,
    department,
    roomNumber,
    semester,
    dateOut,
    timeOut,
    dateIn,
    timeIn,
    purpose,
    place,
    contact,
    consent: !!consent,
  });

  return res.status(201).json({
    message: 'Local gatepass applied successfully',
    gatepassId: doc._id,
    gatePassNo: doc.gatePassNo,
  });
};

exports.deleteLocalGatepass = async (req, res) => {
  const studentId = req.user.userId;
  const { gatepassId } = req.params;

  if (!gatepassId) {
    return res.status(400).json({ message: 'Gatepass ID is required' });
  }

  const gatepass = await LocalGatepass.findOne({ _id: gatepassId, student: studentId });
  if (!gatepass) {
    return res.status(404).json({ message: 'Gatepass not found' });
  }

  if (gatepass.status !== 'pending' || gatepass.utilizationStatus !== 'pending') {
    return res.status(400).json({ message: 'Only pending gatepasses can be withdrawn.' });
  }

  await gatepass.deleteOne();

  return res.json({ message: 'Local gatepass withdrawn successfully.' });
};
