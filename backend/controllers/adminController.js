const User = require('../models/User');
const Guard = require('../models/Guard');
const Admin = require('../models/Admin');
const GateLog = require('../models/GateLog');
const GateRequest = require('../models/GateRequest');

exports.getOverview = async (req, res) => {
  const [students, guards, admins] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Guard.countDocuments({}),
    Admin.countDocuments({}),
  ]);

  const outsideCount = await User.countDocuments({ role: 'student', presence: 'outside' });
  const pendingCount = await GateRequest.countDocuments({ status: 'pending', usedAt: null, expiresAt: { $gt: new Date() } });

  return res.json({ students, guards, admins, outsideCount, pendingCount });
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
