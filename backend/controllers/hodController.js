const OutstationGatepass = require('../models/OutstationGatepass');
const Hod = require('../models/Hod');
const { sendMeetingInviteEmail } = require('../utils/emailService');

// Get pending outstation gatepasses for HOD's department
exports.getPendingGatepasses = async (req, res) => {
    const hodId = req.user.userId;

    // Get HOD's department
    const hod = await Hod.findById(hodId).select('department');
    if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
    }

    const gatepasses = await OutstationGatepass.find({
        currentStage: 'hod',
        department: hod.department,
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
    const hodId = req.user.userId;
    const { gatepassId } = req.params;

    // Get HOD's department
    const hod = await Hod.findById(hodId).select('department');
    if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'imageUrl name rollnumber branch department course');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify HOD can view this gatepass
    if (gatepass.department !== hod.department) {
        return res.status(403).json({ message: 'Not authorized to view this gatepass' });
    }

    return res.json({ gatepass });
};

// Get student's OS gatepass history (for view details page)
exports.getStudentOSHistory = async (req, res) => {
    const hodId = req.user.userId;
    const { studentId } = req.params;

    // Get HOD's department
    const hod = await Hod.findById(hodId).select('department');
    if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
    }

    // Get all OS gatepasses by this student
    const gatepasses = await OutstationGatepass.find({
        student: studentId,
    })
        .sort({ createdAt: -1 })
        .select('gatePassNo currentStage finalStatus stageStatus createdAt dateOut dateIn reasonOfLeave address classesMissed missedDays');

    return res.json({ gatepasses });
};

// Get gatepass history for HOD's department (approved and rejected)
exports.getGatepassHistory = async (req, res) => {
    const hodId = req.user.userId;
    const { search } = req.query;

    // Get HOD's department
    const hod = await Hod.findById(hodId).select('department');
    if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
    }

    let query = {
        department: hod.department,
        'stageStatus.hod.status': { $in: ['approved', 'rejected'] },
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
        .sort({ 'stageStatus.hod.decidedAt': -1, createdAt: -1 })
        .populate('student', 'imageUrl')
        .select('-__v');

    return res.json({ gatepasses });
};

// Approve or reject an outstation gatepass
exports.decideGatepass = async (req, res) => {
    const hodId = req.user.userId;
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

    // Get HOD's department
    const hod = await Hod.findById(hodId).select('department');
    if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId);

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify HOD can only decide gatepasses from their department
    if (gatepass.department !== hod.department) {
        return res.status(403).json({ message: 'You can only manage gatepasses from your department' });
    }

    if (gatepass.currentStage !== 'hod') {
        return res.status(400).json({ message: 'This gatepass is not at HOD stage' });
    }

    // Update stage status
    gatepass.stageStatus.hod = {
        status: decision,
        decidedBy: hodId,
        decidedAt: new Date(),
    };

    if (decision === 'approved') {
        // Move to hostel office for final approval
        gatepass.currentStage = 'hostelOffice';
    } else {
        // Rejected - end the workflow
        gatepass.finalStatus = 'rejected';
        gatepass.currentStage = 'completed';
        gatepass.rejectionReason = rejectionReason.trim();
        gatepass.rejectedBy = {
            stage: 'hod',
            decidedBy: hodId,
            decidedAt: new Date(),
        };
    }

    await gatepass.save();

    return res.json({
        message: decision === 'approved'
            ? 'Gatepass approved and passed to Hostel Office'
            : 'Gatepass rejected',
        gatepass: {
            _id: gatepass._id,
            currentStage: gatepass.currentStage,
            finalStatus: gatepass.finalStatus,
            gatePassNo: gatepass.gatePassNo,
        },
    });
};

// Send meeting email to student
exports.sendMeetingEmail = async (req, res) => {
    const hodId = req.user.userId;
    const { gatepassId, meetingDate, meetingTime } = req.body;

    if (!gatepassId || !meetingDate || !meetingTime) {
        return res.status(400).json({ message: 'Gatepass ID, meeting date and time are required' });
    }

    // Get HOD's department
    const hod = await Hod.findById(hodId).select('department');
    if (!hod) {
        return res.status(404).json({ message: 'HOD not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'email name');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify HOD can only send email for gatepasses from their department
    if (gatepass.department !== hod.department) {
        return res.status(403).json({ message: 'You can only manage gatepasses from your department' });
    }

    if (!gatepass.student?.email) {
        return res.status(400).json({ message: 'Student email not found' });
    }

    try {
        await sendMeetingInviteEmail({
            to: gatepass.student.email,
            studentName: gatepass.studentName || gatepass.student.name,
            meetingDate,
            meetingTime,
            senderRole: 'Head of the Department',
            departmentName: `${hod.department} Department`,
        });

        return res.json({ message: 'Meeting invitation email sent successfully' });
    } catch (err) {
        console.error('Error sending meeting email:', err);
        return res.status(500).json({ message: 'Failed to send email. Please try again.' });
    }
};
