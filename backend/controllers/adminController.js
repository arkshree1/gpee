const User = require('../models/User');
const Guard = require('../models/Guard');
const Admin = require('../models/Admin');
const GateLog = require('../models/GateLog');
const GateRequest = require('../models/GateRequest');
const LocalGatepass = require('../models/LocalGatepass');
const OutstationGatepass = require('../models/OutstationGatepass');

exports.getOverview = async (req, res) => {
  const [
    studentsInside,
    studentsOutside,
    guards,
    admins,
    // Count students currently outside using local gatepass (localActiveGPNo is not null)
    localGatepassExits,
    // Count students currently outside using outstation gatepass (OSActiveGPNo is not null)
    outstationGatepassExits,
    pendingCount
  ] = await Promise.all([
    User.countDocuments({ role: 'student', presence: 'inside' }),
    User.countDocuments({ role: 'student', presence: 'outside' }),
    Guard.countDocuments({}),
    Admin.countDocuments({}),
    // Students outside using LOCAL gatepass (localActiveGPNo has a value like L-00002)
    User.countDocuments({ role: 'student', presence: 'outside', localActiveGPNo: { $ne: null } }),
    // Students outside using OUTSTATION gatepass (OSActiveGPNo has a value like OS-00002)
    User.countDocuments({ role: 'student', presence: 'outside', OSActiveGPNo: { $ne: null } }),
    GateRequest.countDocuments({
      status: 'pending',
      usedAt: null,
      expiresAt: { $gt: new Date() }
    })
  ]);

  // Calculate students outside using NORMAL entry-exit (no gatepass)
  const normalExits = studentsOutside - localGatepassExits - outstationGatepassExits;

  return res.json({
    studentsInside,
    studentsOutside,
    guards,
    admins,
    localGatepassExits,
    outstationGatepassExits,
    normalExits, // NEW: students outside without any gatepass
    pendingCount
  });
};

exports.getLogs = async (req, res) => {
  const logs = await GateLog.find({})
    .sort({ decidedAt: -1 })
    .limit(200)
    .populate('student', 'name rollnumber')
    .populate('guard', 'name email');
  return res.json({ logs });
};

exports.getUsers = async (req, res) => {
  const users = await User.find({}).select('name rollnumber email role presence imageUrl createdAt');
  return res.json({ users });
};

// Live activity logs for real-time dashboard panel - from GateRequest
// Only show APPROVED requests (after guard has approved the QR)
exports.getLiveLogs = async (req, res) => {
  try {
    const logs = await GateRequest.find({ status: 'approved' })
      .sort({ decidedAt: -1 })
      .limit(50)
      .populate('student', 'name rollnumber imageUrl')
      .select('direction decidedAt student status purpose place');

    // Transform to clean format for frontend
    const liveLogs = logs.map(log => ({
      id: log._id,
      studentId: log.student?._id || null,
      actionType: log.direction === 'exit' ? 'EXIT' : 'ENTRY',
      studentName: log.student?.name || 'Unknown',
      rollNumber: log.student?.rollnumber || '--',
      imageUrl: log.student?.imageUrl || null,
      timestamp: log.decidedAt,
      status: log.status,
      purpose: log.purpose,
      place: log.place,
    }));

    return res.json({ logs: liveLogs });
  } catch (error) {
    console.error('Error fetching live logs:', error);
    return res.status(500).json({ message: 'Failed to fetch live logs' });
  }
};

// Detailed activity logs for the Students page - includes contact number and type
exports.getDetailedLogs = async (req, res) => {
  try {
    const logs = await GateRequest.find({ status: 'approved' })
      .sort({ decidedAt: -1 })
      .limit(200)
      .populate('student', 'name rollnumber contactNumber imageUrl')
      .select('direction decidedAt student purpose place gatePassNo isOutstation');

    const detailedLogs = logs.map(log => {
      // gatePassNo already contains the format like "L-00008" or "OS-00002"
      let type = 'Normal';
      if (log.gatePassNo) {
        type = log.gatePassNo;
      }

      return {
        id: log._id,
        studentId: log.student?._id || null,
        name: log.student?.name || 'Unknown',
        rollNumber: log.student?.rollnumber || '--',
        contactNumber: log.student?.contactNumber || '--',
        imageUrl: log.student?.imageUrl || null,
        activity: log.direction === 'exit' ? 'EXIT' : 'ENTRY',
        type: type,
        place: log.place || '--',
        purpose: log.purpose || '--',
        timestamp: log.decidedAt,
      };
    });

    return res.json({ logs: detailedLogs });
  } catch (error) {
    console.error('Error fetching detailed logs:', error);
    return res.status(500).json({ message: 'Failed to fetch detailed logs' });
  }
};

// Get students inside campus
exports.getStudentsInside = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', presence: 'inside' })
      .select('name rollnumber email roomNumber hostelName contactNumber')
      .sort({ name: 1 });
    return res.json({ students });
  } catch (error) {
    console.error('Error fetching students inside:', error);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

// Get students outside campus (normal exit - no active gatepass)
exports.getStudentsOutside = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      presence: 'outside',
      localActiveGPNo: null,
      OSActiveGPNo: null
    })
      .select('name rollnumber email roomNumber hostelName contactNumber')
      .sort({ name: 1 });
    return res.json({ students });
  } catch (error) {
    console.error('Error fetching students outside:', error);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

// Get students currently outside using local gatepass
exports.getLocalGatepassExits = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      presence: 'outside',
      localActiveGPNo: { $ne: null }
    })
      .select('name rollnumber email roomNumber hostelName contactNumber')
      .sort({ name: 1 });
    return res.json({ students });
  } catch (error) {
    console.error('Error fetching local gatepass exits:', error);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

// Get students currently outside using outstation gatepass
exports.getOutstationGatepassExits = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      presence: 'outside',
      OSActiveGPNo: { $ne: null }
    })
      .select('name rollnumber email roomNumber hostelName contactNumber')
      .sort({ name: 1 });
    return res.json({ students });
  } catch (error) {
    console.error('Error fetching outstation gatepass exits:', error);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

// Get all students (for Total Students card)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name rollnumber email roomNumber hostelName contactNumber')
      .sort({ name: 1 });
    return res.json({ students });
  } catch (error) {
    console.error('Error fetching all students:', error);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

// Search students by name or roll number (for autocomplete)
exports.searchStudents = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ students: [] });

    const regex = new RegExp(q, 'i');

    // Search by name OR roll number
    const students = await User.find({
      role: 'student',
      $or: [
        { name: regex },
        { rollnumber: regex }
      ]
    })
      .select('name rollnumber email roomNumber hostelName contactNumber imageUrl department branch')
      .limit(10)
      .sort({ name: 1 });

    return res.json({ students });
  } catch (error) {
    console.error('Error searching students:', error);
    return res.status(500).json({ message: 'Failed to search students' });
  }
};

// Get a specific student's entry-exit logs
exports.getStudentLogs = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student details
    const student = await User.findById(studentId)
      .select('name rollnumber email roomNumber hostelName contactNumber imageUrl department branch');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get the student's entry-exit logs from GateRequest (approved ones)
    const logs = await GateRequest.find({
      student: studentId,
      status: 'approved'
    })
      .sort({ decidedAt: -1 })
      .limit(50)
      .select('direction decidedAt purpose place gatePassNo isOutstation');

    const formattedLogs = logs.map(log => {
      let type = 'Normal';
      if (log.gatePassNo) {
        if (log.gatePassNo.startsWith('OS-')) {
          type = 'Outstation GP';
        } else if (log.gatePassNo.startsWith('L-')) {
          type = 'Local GP';
        }
      }

      return {
        id: log._id,
        direction: log.direction === 'exit' ? 'EXIT' : 'ENTRY',
        timestamp: log.decidedAt,
        purpose: log.purpose || '--',
        place: log.place || '--',
        gatePassNo: log.gatePassNo || null,
        type
      };
    });

    return res.json({ student, logs: formattedLogs });
  } catch (error) {
    console.error('Error fetching student logs:', error);
    return res.status(500).json({ message: 'Failed to fetch student logs' });
  }
};

// Search gatepass by type and number
exports.searchGatepass = async (req, res) => {
  try {
    const { type, number } = req.query;

    if (!type || !number) {
      return res.status(400).json({ message: 'Type and number are required' });
    }

    let gatepass = null;
    let gatepassType = type.toUpperCase();

    if (gatepassType === 'LOCAL') {
      // Search for local gatepass - format: L-00001
      const gatePassNo = `L-${number.padStart(5, '0')}`;
      gatepass = await LocalGatepass.findOne({ gatePassNo })
        .populate('student', 'name rollnumber email contactNumber imageUrl branch department course hostelName roomNumber');

      if (!gatepass) {
        return res.status(404).json({ message: `Local gatepass ${gatePassNo} not found` });
      }

      return res.json({
        type: 'LOCAL',
        gatePassNo: gatepass.gatePassNo,
        student: {
          name: gatepass.student?.name || gatepass.studentName,
          rollnumber: gatepass.student?.rollnumber || gatepass.rollnumber,
          email: gatepass.student?.email || '--',
          contactNumber: gatepass.student?.contactNumber || gatepass.contact,
          imageUrl: gatepass.student?.imageUrl || null,
          branch: gatepass.student?.branch || gatepass.department,
          department: gatepass.student?.department || gatepass.department,
          course: gatepass.student?.course || '--',
          hostelName: gatepass.student?.hostelName || '--',
          roomNumber: gatepass.student?.roomNumber || gatepass.roomNumber,
        },
        gatepassDetails: {
          purpose: gatepass.purpose,
          place: gatepass.place,
          plannedDateOut: gatepass.dateOut,
          plannedTimeOut: gatepass.timeOut,
          plannedDateIn: gatepass.dateIn,
          plannedTimeIn: gatepass.timeIn,
          status: gatepass.status,
          appliedAt: gatepass.createdAt,
          approvedAt: gatepass.decidedAt,
          actualExitAt: gatepass.actualExitAt,
          actualEntryAt: gatepass.actualEntryAt,
          utilizationStatus: gatepass.utilizationStatus,
          utilized: gatepass.utilized,
        }
      });

    } else if (gatepassType === 'OUTSTATION') {
      // Search for outstation gatepass - format: OS-00001
      const gatePassNo = `OS-${number.padStart(5, '0')}`;
      gatepass = await OutstationGatepass.findOne({ gatePassNo })
        .populate('student', 'name rollnumber email contactNumber imageUrl branch department course hostelName roomNumber');

      if (!gatepass) {
        return res.status(404).json({ message: `Outstation gatepass ${gatePassNo} not found` });
      }

      return res.json({
        type: 'OUTSTATION',
        gatePassNo: gatepass.gatePassNo,
        student: {
          name: gatepass.student?.name || gatepass.studentName,
          rollnumber: gatepass.student?.rollnumber || gatepass.rollnumber,
          email: gatepass.student?.email || '--',
          contactNumber: gatepass.student?.contactNumber || gatepass.contact,
          imageUrl: gatepass.student?.imageUrl || null,
          branch: gatepass.student?.branch || gatepass.branch,
          department: gatepass.student?.department || gatepass.department,
          course: gatepass.student?.course || gatepass.course,
          hostelName: gatepass.student?.hostelName || '--',
          roomNumber: gatepass.student?.roomNumber || gatepass.roomNumber,
        },
        gatepassDetails: {
          natureOfLeave: gatepass.natureOfLeave,
          reasonOfLeave: gatepass.reasonOfLeave,
          address: gatepass.address,
          leaveDays: gatepass.leaveDays,
          plannedDateOut: gatepass.dateOut,
          plannedTimeOut: gatepass.timeOut,
          plannedDateIn: gatepass.dateIn,
          plannedTimeIn: gatepass.timeIn,
          classesMissed: gatepass.classesMissed,
          missedDays: gatepass.missedDays,
          currentStage: gatepass.currentStage,
          finalStatus: gatepass.finalStatus,
          stageStatus: gatepass.stageStatus,
          appliedAt: gatepass.createdAt,
          actualExitAt: gatepass.actualExitAt,
          actualEntryAt: gatepass.actualEntryAt,
          utilizationStatus: gatepass.utilizationStatus,
          utilized: gatepass.utilized,
          proofFile: gatepass.proofFile,
        }
      });

    } else {
      return res.status(400).json({ message: 'Invalid type. Use LOCAL or OUTSTATION' });
    }

  } catch (error) {
    console.error('Error searching gatepass:', error);
    return res.status(500).json({ message: 'Failed to search gatepass' });
  }
};
