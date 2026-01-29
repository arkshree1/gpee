const LocalGatepass = require('../models/LocalGatepass');
const OutstationGatepass = require('../models/OutstationGatepass');
const GateLog = require('../models/GateLog');
const User = require('../models/User');
const { sendOutstationApprovalNotification, sendOutstationRejectionNotification } = require('../utils/emailService');

// Get all pending local gatepasses for hostel office to review
exports.getPendingGatepasses = async (req, res) => {
    const gatepasses = await LocalGatepass.find({ status: 'pending' })
        .populate('student', 'imageUrl hostelName course presence')
        .sort({ createdAt: -1 })
        .select('-__v');

    // Map gatepasses to include hostelName and course from student
    const mappedGatepasses = gatepasses.map(gp => {
        const gpObj = gp.toObject();
        if (gpObj.student) {
            gpObj.hostelName = gpObj.student.hostelName || null;
            gpObj.course = gpObj.student.course || null;
        }
        return gpObj;
    });

    return res.json({ gatepasses: mappedGatepasses });
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
        .populate('student', 'imageUrl hostelName course presence')
        .select('-__v');

    // Map gatepasses to include hostelName and course from student
    const mappedGatepasses = gatepasses.map(gp => {
        const gpObj = gp.toObject();
        if (gpObj.student) {
            gpObj.hostelName = gpObj.student.hostelName || null;
            gpObj.course = gpObj.student.course || null;
        }
        return gpObj;
    });

    return res.json({ gatepasses: mappedGatepasses });
};

// Get entry-exit logs (only approved ones)
exports.getEntryExitLogs = async (req, res) => {
    const { date, search } = req.query;

    let query = {
        exitOutcome: 'approved',
        // entryOutcome: 'approved', // Show all exits, even if entry is pending
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
        gatePass: log.gatePassNo || '--',
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
    // Set utilizationStatus to 'pending' when approved (awaiting student exit)
    if (decision === 'approved') {
        gatepass.utilizationStatus = 'pending';
    }
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

// ==================== OUTSTATION GATEPASS ENDPOINTS ====================

// Get student's local gatepass history with actual entry/exit times
exports.getLocalStudentHistory = async (req, res) => {
    const { studentId } = req.params;

    // Get all local gatepasses for this student (excluding pending ones)
    // Now includes actualExitAt and actualEntryAt directly from LocalGatepass
    const gatepasses = await LocalGatepass.find({
        student: studentId,
        status: { $in: ['approved', 'denied'] },
    })
        .sort({ createdAt: -1 })
        .select('gatePassNo status place purpose timeOut timeIn dateOut dateIn createdAt decidedAt utilized utilizationStatus actualExitAt actualEntryAt')
        .limit(20);

    return res.json({ gatepasses });
};

// Get pending outstation gatepasses for hostel office (approved by HOD)
exports.getOSPendingGatepasses = async (req, res) => {
    const gatepasses = await OutstationGatepass.find({
        currentStage: 'hostelOffice',
    })
        .sort({ createdAt: -1 })
        .select('studentName rollnumber course department branch contact roomNumber student createdAt')
        .populate('student', 'imageUrl branch hostelName');

    // For existing records without branch, use the student's branch; add hostelName
    const mappedGatepasses = gatepasses.map(gp => {
        const gpObj = gp.toObject();
        if (!gpObj.branch && gpObj.student?.branch) {
            gpObj.branch = gpObj.student.branch;
        }
        gpObj.hostelName = gpObj.student?.hostelName || null;
        return gpObj;
    });

    return res.json({ gatepasses: mappedGatepasses });
};

// Get single outstation gatepass details
exports.getOSGatepassDetails = async (req, res) => {
    const { gatepassId } = req.params;

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'imageUrl name rollnumber branch department course hostelName');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Add hostelName from student if not on gatepass
    const gpObj = gatepass.toObject();
    if (!gpObj.hostelName && gpObj.student?.hostelName) {
        gpObj.hostelName = gpObj.student.hostelName;
    }

    return res.json({ gatepass: gpObj });
};

// Get student's OS gatepass history
exports.getOSStudentHistory = async (req, res) => {
    const { studentId } = req.params;

    const gatepasses = await OutstationGatepass.find({
        student: studentId,
    })
        .sort({ createdAt: -1 })
        .select('gatePassNo currentStage finalStatus stageStatus createdAt dateOut dateIn reasonOfLeave address classesMissed missedDays');

    return res.json({ gatepasses });
};

// Get outstation gatepass history (approved/rejected by hostel office)
exports.getOSGatepassHistory = async (req, res) => {
    const { search } = req.query;

    let query = {
        'stageStatus.hostelOffice.status': { $in: ['approved', 'rejected'] },
    };

    if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
            { studentName: searchRegex },
            { rollnumber: searchRegex },
        ];
    }

    const gatepasses = await OutstationGatepass.find(query)
        .sort({ 'stageStatus.hostelOffice.decidedAt': -1, createdAt: -1 })
        .populate('student', 'imageUrl')
        .select('-__v');

    return res.json({ gatepasses });
};

// Approve or reject an outstation gatepass
exports.decideOSGatepass = async (req, res) => {
    const hostelOfficeId = req.user.userId;
    const { gatepassId, decision, rejectionReason } = req.body;

    if (!gatepassId || !decision) {
        return res.status(400).json({ message: 'Gatepass ID and decision are required' });
    }

    if (!['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({ message: 'Decision must be either approved or rejected' });
    }

    // If rejecting, require a reason
    if (decision === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
        return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId);

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    if (gatepass.currentStage !== 'hostelOffice') {
        return res.status(400).json({ message: 'This gatepass is not at Hostel Office stage' });
    }

    // Update stage status
    gatepass.stageStatus.hostelOffice = {
        status: decision,
        decidedBy: hostelOfficeId,
        decidedAt: new Date(),
    };

    if (decision === 'approved') {
        // Final approval - gatepass is approved
        gatepass.finalStatus = 'approved';
        gatepass.currentStage = 'completed';
        gatepass.utilizationStatus = 'pending'; // Awaiting student exit
        // Generate sequential 5-digit gatepass number (OS-00001, OS-00002, etc.)
        const lastGatepass = await OutstationGatepass.findOne({ gatePassNo: { $ne: null } })
            .sort({ gatePassNo: -1 })
            .select('gatePassNo');
        let nextNum = 1;
        if (lastGatepass?.gatePassNo) {
            const match = lastGatepass.gatePassNo.match(/OS-(\d+)/);
            if (match) {
                nextNum = parseInt(match[1], 10) + 1;
            }
        }
        gatepass.gatePassNo = `OS-${String(nextNum).padStart(5, '0')}`;
    } else {
        // Rejected - end the workflow
        gatepass.finalStatus = 'rejected';
        gatepass.currentStage = 'completed';
        gatepass.rejectionReason = rejectionReason.trim();
        gatepass.rejectedBy = {
            stage: 'hostelOffice',
            decidedBy: hostelOfficeId,
            decidedAt: new Date(),
        };
    }

    await gatepass.save();

    // Send email notification to student
    try {
        const studentData = await User.findById(gatepass.student).select('email');

        if (decision === 'approved') {
            // Send approval email to student with gatepass number
            if (studentData && studentData.email) {
                await sendOutstationApprovalNotification({
                    to: studentData.email,
                    studentName: gatepass.studentName,
                    rollnumber: gatepass.rollnumber,
                    gatePassNo: gatepass.gatePassNo,
                    dateOut: gatepass.dateOut,
                    dateIn: gatepass.dateIn,
                    reasonOfLeave: gatepass.reasonOfLeave,
                    address: gatepass.address,
                });
            }
        } else {
            // Send rejection email to student
            if (studentData && studentData.email) {
                await sendOutstationRejectionNotification({
                    to: studentData.email,
                    studentName: gatepass.studentName,
                    rollnumber: gatepass.rollnumber,
                    rejectedByRole: 'Hostel Office',
                    rejectionReason: gatepass.rejectionReason,
                    dateOut: gatepass.dateOut,
                    dateIn: gatepass.dateIn,
                    reasonOfLeave: gatepass.reasonOfLeave,
                    address: gatepass.address,
                });
            }
        }
    } catch (emailErr) {
        console.error('Failed to send email notification:', emailErr);
        // Don't fail the request if email fails
    }

    return res.json({
        message: decision === 'approved'
            ? 'Gatepass approved successfully'
            : 'Gatepass rejected',
        gatepass: {
            _id: gatepass._id,
            currentStage: gatepass.currentStage,
            finalStatus: gatepass.finalStatus,
            gatePassNo: gatepass.gatePassNo,
        },
    });
};
