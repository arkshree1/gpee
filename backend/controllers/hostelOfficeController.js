const LocalGatepass = require('../models/LocalGatepass');
const GateLog = require('../models/GateLog');
const User = require('../models/User');

// Get all pending local gatepasses for hostel office to review
exports.getPendingGatepasses = async (req, res) => {
    const gatepasses = await LocalGatepass.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .select('-__v');

    return res.json({ gatepasses });
};

// Get all local gatepasses for history (approved and denied only)
exports.getGatepassHistory = async (req, res) => {
    const { search } = req.query;

    let query = { status: { $in: ['approved', 'denied'] } };

    // If search query provided, filter by name or roll number
    if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
            { studentName: searchRegex },
            { rollnumber: searchRegex },
        ];
    }

    const gatepasses = await LocalGatepass.find(query)
        .sort({ decidedAt: -1, createdAt: -1 })
        .select('-__v');

    return res.json({ gatepasses });
};

// Get entry-exit logs (only approved ones)
exports.getEntryExitLogs = async (req, res) => {
    const { date, search } = req.query;

    let query = {
        exitOutcome: 'approved',
        entryOutcome: 'approved',
    };

    // Filter by date if provided
    if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query.exitStatusTime = {
            $gte: startOfDay,
            $lte: endOfDay,
        };
    }

    const logs = await GateLog.find(query)
        .populate('student', 'name rollnumber roomNumber contactNumber')
        .sort({ exitStatusTime: -1 })
        .limit(100);

    // Format the logs for frontend
    let formattedLogs = logs.map((log, index) => ({
        _id: log._id,
        srNo: index + 1,
        name: log.student?.name || '--',
        rollNo: log.student?.rollnumber || '--',
        roomNo: log.student?.roomNumber || '--',
        contact: log.student?.contactNumber || '--',
        place: log.place || '--',
        purpose: log.purpose || '--',
        gatePass: '--',
        timeOut: log.exitStatusTime,
        timeIn: log.entryStatusTime,
    }));

    // Apply search filter if provided
    if (search && search.trim()) {
        const searchLower = search.trim().toLowerCase();
        formattedLogs = formattedLogs.filter(log =>
            log.name.toLowerCase().includes(searchLower) ||
            log.rollNo.toLowerCase().includes(searchLower)
        );
    }

    return res.json({ logs: formattedLogs });
};

// Approve or deny a local gatepass
exports.decideGatepass = async (req, res) => {
    const hostelOfficeId = req.user.userId;
    const { gatepassId, decision } = req.body;

    if (!gatepassId || !decision) {
        return res.status(400).json({ message: 'Gatepass ID and decision are required' });
    }

    if (!['approved', 'denied'].includes(decision)) {
        return res.status(400).json({ message: 'Decision must be either approved or denied' });
    }

    const gatepass = await LocalGatepass.findById(gatepassId);

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    if (gatepass.status !== 'pending') {
        return res.status(400).json({ message: 'This gatepass has already been decided' });
    }

    gatepass.status = decision;
    gatepass.decidedBy = hostelOfficeId;
    gatepass.decidedAt = new Date();
    await gatepass.save();

    return res.json({
        message: `Gatepass ${decision} successfully`,
        gatepass: {
            _id: gatepass._id,
            gatePassNo: gatepass.gatePassNo,
            status: gatepass.status,
        },
    });
};
