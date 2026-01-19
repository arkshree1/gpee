const OutstationGatepass = require('../models/OutstationGatepass');
const Dugc = require('../models/Dugc');

// Get pending outstation gatepasses for DUGC's department
exports.getPendingGatepasses = async (req, res) => {
    const dugcId = req.user.userId;

    // Get DUGC's department
    const dugc = await Dugc.findById(dugcId).select('department');
    if (!dugc) {
        return res.status(404).json({ message: 'DUGC not found' });
    }

    const gatepasses = await OutstationGatepass.find({
        currentStage: 'dugc',
        department: dugc.department,
    })
        .sort({ createdAt: -1 })
        .select('studentName rollnumber course department branch contact roomNumber student createdAt')
        .populate('student', 'imageUrl branch');

    // For existing records without branch, use the student's branch
    const mappedGatepasses = gatepasses.map(gp => {
        const gpObj = gp.toObject();
        if (!gpObj.branch && gpObj.student?.branch) {
            gpObj.branch = gpObj.student.branch;
        }
        return gpObj;
    });

    return res.json({ gatepasses: mappedGatepasses });
};

// Get single gatepass details for view details page
exports.getGatepassDetails = async (req, res) => {
    const dugcId = req.user.userId;
    const { gatepassId } = req.params;

    // Get DUGC's department
    const dugc = await Dugc.findById(dugcId).select('department');
    if (!dugc) {
        return res.status(404).json({ message: 'DUGC not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'imageUrl name rollnumber branch department course');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify DUGC can view this gatepass
    if (gatepass.department !== dugc.department) {
        return res.status(403).json({ message: 'Not authorized to view this gatepass' });
    }

    return res.json({ gatepass });
};

// Get student's OS gatepass history (for view details page)
exports.getStudentOSHistory = async (req, res) => {
    const dugcId = req.user.userId;
    const { studentId } = req.params;

    // Get DUGC's department
    const dugc = await Dugc.findById(dugcId).select('department');
    if (!dugc) {
        return res.status(404).json({ message: 'DUGC not found' });
    }

    // Get all OS gatepasses by this student
    const gatepasses = await OutstationGatepass.find({
        student: studentId,
    })
        .sort({ createdAt: -1 })
        .select('gatePassNo currentStage finalStatus stageStatus createdAt dateOut dateIn reasonOfLeave address classesMissed missedDays');

    return res.json({ gatepasses });
};

// Get gatepass history for DUGC's department (approved and rejected)
exports.getGatepassHistory = async (req, res) => {
    const dugcId = req.user.userId;
    const { search } = req.query;

    // Get DUGC's department
    const dugc = await Dugc.findById(dugcId).select('department');
    if (!dugc) {
        return res.status(404).json({ message: 'DUGC not found' });
    }

    let query = {
        department: dugc.department,
        'stageStatus.dugc.status': { $in: ['approved', 'rejected'] },
    };

    // If search query provided, filter by name or roll number
    if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
            { studentName: searchRegex },
            { rollnumber: searchRegex },
        ];
    }

    const gatepasses = await OutstationGatepass.find(query)
        .sort({ 'stageStatus.dugc.decidedAt': -1, createdAt: -1 })
        .select('-__v');

    return res.json({ gatepasses });
};

// Approve or reject an outstation gatepass
exports.decideGatepass = async (req, res) => {
    const dugcId = req.user.userId;
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

    // Get DUGC's department
    const dugc = await Dugc.findById(dugcId).select('department');
    if (!dugc) {
        return res.status(404).json({ message: 'DUGC not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId);

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify DUGC can only decide gatepasses from their department
    if (gatepass.department !== dugc.department) {
        return res.status(403).json({ message: 'You can only manage gatepasses from your department' });
    }

    if (gatepass.currentStage !== 'dugc') {
        return res.status(400).json({ message: 'This gatepass is not at DUGC stage' });
    }

    // Update stage status
    gatepass.stageStatus.dugc = {
        status: decision,
        decidedBy: dugcId,
        decidedAt: new Date(),
    };

    if (decision === 'approved') {
        // Move to next stage (HOD)
        gatepass.currentStage = 'hod';
    } else {
        // Rejected - end the workflow
        gatepass.finalStatus = 'rejected';
        gatepass.currentStage = 'completed';
        gatepass.rejectionReason = rejectionReason.trim();
        gatepass.rejectedBy = {
            stage: 'dugc',
            decidedBy: dugcId,
            decidedAt: new Date(),
        };
    }

    await gatepass.save();

    return res.json({
        message: decision === 'approved'
            ? 'Gatepass approved and passed to HOD'
            : 'Gatepass rejected',
        gatepass: {
            _id: gatepass._id,
            currentStage: gatepass.currentStage,
            finalStatus: gatepass.finalStatus,
        },
    });
};
