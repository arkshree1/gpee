const User = require('../models/User');
const Guard = require('../models/Guard');
const Admin = require('../models/Admin');
const GateLog = require('../models/GateLog');
const GateRequest = require('../models/GateRequest');
const LocalGatepass = require('../models/LocalGatepass');
const OutstationGatepass = require('../models/OutstationGatepass');

exports.getOverview = async (req, res) => {
  const [studentsInside, studentsOutside, guards, admins] = await Promise.all([
    User.countDocuments({ role: 'student', presence: 'inside' }),
    User.countDocuments({ role: 'student', presence: 'outside' }),
    Guard.countDocuments({}),
    Admin.countDocuments({}),
  ]);

  // Count students currently outside using local gatepass (status = approved, exitUsed = true, entryUsed = false)
  const localGatepassExits = await LocalGatepass.countDocuments({
    status: 'approved',
    exitUsed: true,
    entryUsed: false,
  });

  // Count students currently outside using outstation gatepass (status = approved, exitUsed = true, entryUsed = false)
  const outstationGatepassExits = await OutstationGatepass.countDocuments({
    status: 'approved',
    exitUsed: true,
    entryUsed: false,
  });

  const pendingCount = await GateRequest.countDocuments({
    status: 'pending',
    usedAt: null,
    expiresAt: { $gt: new Date() }
  });

  return res.json({
    studentsInside,
    studentsOutside,
    guards,
    admins,
    localGatepassExits,
    outstationGatepassExits,
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
      .populate('student', 'name rollnumber')
      .select('direction decidedAt student status purpose place');

    // Transform to clean format for frontend
    const liveLogs = logs.map(log => ({
      id: log._id,
      actionType: log.direction === 'exit' ? 'EXIT' : 'ENTRY',
      studentName: log.student?.name || 'Unknown',
      rollNumber: log.student?.rollnumber || '--',
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
      .populate('student', 'name rollnumber contactNumber')
      .select('direction decidedAt student purpose place gatePassNo isOutstation');

    const detailedLogs = logs.map(log => {
      // gatePassNo already contains the format like "L-00008" or "OS-00002"
      let type = 'Normal';
      if (log.gatePassNo) {
        type = log.gatePassNo;
      }

      return {
        id: log._id,
        name: log.student?.name || 'Unknown',
        rollNumber: log.student?.rollnumber || '--',
        contactNumber: log.student?.contactNumber || '--',
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
      .select('name rollnumber roomNumber hostelName contactNumber')
      .sort({ name: 1 });
    return res.json({ students });
  } catch (error) {
    console.error('Error fetching students inside:', error);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

// Get students outside campus
exports.getStudentsOutside = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', presence: 'outside' })
      .select('name rollnumber roomNumber hostelName contactNumber')
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
    const gatepasses = await LocalGatepass.find({
      status: 'approved',
      exitUsed: true,
      entryUsed: false,
    })
      .populate('student', 'name rollnumber roomNumber hostelName contactNumber')
      .select('student outTime inTime purpose place');

    const students = gatepasses.map(gp => ({
      _id: gp.student?._id,
      name: gp.student?.name || 'Unknown',
      rollnumber: gp.student?.rollnumber || '--',
      roomNumber: gp.student?.roomNumber || '--',
      hostelName: gp.student?.hostelName || '--',
      contactNumber: gp.student?.contactNumber || '--',
      outTime: gp.outTime,
      inTime: gp.inTime,
      purpose: gp.purpose,
      place: gp.place,
    }));

    return res.json({ students });
  } catch (error) {
    console.error('Error fetching local gatepass exits:', error);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

// Get students currently outside using outstation gatepass
exports.getOutstationGatepassExits = async (req, res) => {
  try {
    const gatepasses = await OutstationGatepass.find({
      status: 'approved',
      exitUsed: true,
      entryUsed: false,
    })
      .populate('student', 'name rollnumber roomNumber hostelName contactNumber')
      .select('student outTime inTime purpose place');

    const students = gatepasses.map(gp => ({
      _id: gp.student?._id,
      name: gp.student?.name || 'Unknown',
      rollnumber: gp.student?.rollnumber || '--',
      roomNumber: gp.student?.roomNumber || '--',
      hostelName: gp.student?.hostelName || '--',
      contactNumber: gp.student?.contactNumber || '--',
      outTime: gp.outTime,
      inTime: gp.inTime,
      purpose: gp.purpose,
      place: gp.place,
    }));

    return res.json({ students });
  } catch (error) {
    console.error('Error fetching outstation gatepass exits:', error);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

