const LocalGatepass = require('../models/LocalGatepass');
const HostelOffice = require('../models/HostelOffice');
const { sendLocalGatepassNotification } = require('../utils/emailService');

// Frontend URL for hostel office
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://192.168.3.11:3123';

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

  // Send email notification to Hostel Office (async, don't block response)
  (async () => {
    try {
      // Get all hostel office emails
      const hostelOffices = await HostelOffice.find({}).select('email');
      
      if (hostelOffices.length > 0) {
        const reviewLink = `${FRONTEND_URL}/hostel-office`;
        
        // Format date for display (DD/MM/YYYY format)
        const formatDate = (dateStr) => {
          if (!dateStr) return dateStr;
          const parts = dateStr.split('-'); // YYYY-MM-DD
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
          return dateStr;
        };
        
        // Format time for display (12-hour format)
        const formatTime = (timeStr) => {
          if (!timeStr) return timeStr;
          const [hours, minutes] = timeStr.split(':');
          const h = parseInt(hours, 10);
          const ampm = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 || 12;
          return `${h12}:${minutes} ${ampm}`;
        };
        
        // Send email to all hostel office accounts
        for (const ho of hostelOffices) {
          await sendLocalGatepassNotification({
            to: ho.email,
            studentName,
            rollnumber,
            department,
            roomNumber,
            gatePassNo,
            purpose,
            place,
            dateOut: formatDate(dateOut),
            timeOut: formatTime(timeOut),
            dateIn: formatDate(dateIn),
            timeIn: formatTime(timeIn),
            reviewLink,
          });
        }
        console.log(`Local gatepass notification sent to ${hostelOffices.length} hostel office(s) for ${gatePassNo}`);
      }
    } catch (emailErr) {
      console.error('Error sending local gatepass notification email:', emailErr);
      // Don't fail the request if email fails
    }
  })();

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
