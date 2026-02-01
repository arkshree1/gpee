const GateLog = require('../models/GateLog');

exports.getMyLogs = async (req, res) => {
  const studentId = req.user.userId;

  // Only fetch 'exit' direction logs to avoid duplicate entry-only logs
  // The exit logs contain both exitStatusTime and entryStatusTime after completion
  const logs = await GateLog.find({ student: studentId, direction: 'exit' })
    .sort({ decidedAt: -1 })
    .limit(50);

  return res.json({ logs });
};
