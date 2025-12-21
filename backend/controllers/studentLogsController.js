const GateLog = require('../models/GateLog');

exports.getMyLogs = async (req, res) => {
  const studentId = req.user.userId;

  const logs = await GateLog.find({ student: studentId })
    .sort({ decidedAt: -1 })
    .limit(50);

  return res.json({ logs });
};
