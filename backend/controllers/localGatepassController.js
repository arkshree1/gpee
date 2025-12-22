const LocalGatepass = require('../models/LocalGatepass');

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

  const doc = await LocalGatepass.create({
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
    place,
    contact,
    consent: !!consent,
  });

  return res.status(201).json({ message: 'Local gatepass submitted successfully', gatepassId: doc._id });
};
