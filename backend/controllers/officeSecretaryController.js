const OutstationGatepass = require('../models/OutstationGatepass');
const OfficeSecretary = require('../models/OfficeSecretary');
const Dugc = require('../models/Dugc');
const Dpgc = require('../models/Dpgc');
const User = require('../models/User');
const { sendMeetingInviteEmail, sendOutstationGatepassNotification, sendOutstationRejectionNotification } = require('../utils/emailService');

// Get Office Secretary profile (name and department)
exports.getProfile = async (req, res) => {
    const secretaryId = req.user.userId;

    const secretary = await OfficeSecretary.findById(secretaryId).select('name department');
    if (!secretary) {
        return res.status(404).json({ message: 'Secretary not found' });
    }

    return res.json({ name: secretary.name, department: secretary.department });
};

// Get pending outstation gatepasses for the secretary's department (card view)
exports.getPendingGatepasses = async (req, res) => {
    const secretaryId = req.user.userId;

    // Get secretary's department
    const secretary = await OfficeSecretary.findById(secretaryId).select('department');
    if (!secretary) {
        return res.status(404).json({ message: 'Secretary not found' });
    }

    const gatepasses = await OutstationGatepass.find({
        currentStage: 'officeSecretary',
        department: secretary.department,
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
    const secretaryId = req.user.userId;
    const { gatepassId } = req.params;

    // Get secretary's department
    const secretary = await OfficeSecretary.findById(secretaryId).select('department');
    if (!secretary) {
        return res.status(404).json({ message: 'Secretary not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'imageUrl name rollnumber branch department course');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify secretary can view this gatepass
    if (gatepass.department !== secretary.department) {
        return res.status(403).json({ message: 'Not authorized to view this gatepass' });
    }

    return res.json({ gatepass });
};

// Get student's OS gatepass history (for view details page)
exports.getStudentOSHistory = async (req, res) => {
    const secretaryId = req.user.userId;
    const { studentId } = req.params;

    // Get secretary's department
    const secretary = await OfficeSecretary.findById(secretaryId).select('department');
    if (!secretary) {
        return res.status(404).json({ message: 'Secretary not found' });
    }

    // Get all OS gatepasses by this student
    const gatepasses = await OutstationGatepass.find({
        student: studentId,
    })
        .sort({ createdAt: -1 })
        .select('gatePassNo currentStage finalStatus stageStatus createdAt dateOut dateIn reasonOfLeave address classesMissed missedDays');

    return res.json({ gatepasses });
};

// Get gatepass history for secretary's department (approved and rejected)
exports.getGatepassHistory = async (req, res) => {
    const secretaryId = req.user.userId;
    const { search } = req.query;

    // Get secretary's department
    const secretary = await OfficeSecretary.findById(secretaryId).select('department');
    if (!secretary) {
        return res.status(404).json({ message: 'Secretary not found' });
    }

    let query = {
        department: secretary.department,
        'stageStatus.officeSecretary.status': { $in: ['approved', 'rejected'] },
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
        .sort({ 'stageStatus.officeSecretary.decidedAt': -1, createdAt: -1 })
        .populate('student', 'imageUrl')
        .select('-__v');

    return res.json({ gatepasses });
};

// Approve or reject an outstation gatepass
exports.decideGatepass = async (req, res) => {
    const secretaryId = req.user.userId;
    const { gatepassId, decision, classesMissed, missedDays, previousLeavesTaken, rejectionReason, phdLeaveBalance, secretaryNote } = req.body;

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

    // Get secretary's department
    const secretary = await OfficeSecretary.findById(secretaryId).select('department');
    if (!secretary) {
        return res.status(404).json({ message: 'Secretary not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId);

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify secretary can only decide gatepasses from their department
    if (gatepass.department !== secretary.department) {
        return res.status(403).json({ message: 'You can only manage gatepasses from your department' });
    }

    if (gatepass.currentStage !== 'officeSecretary') {
        return res.status(400).json({ message: 'This gatepass is not at office secretary stage' });
    }

    // Update stage status
    gatepass.stageStatus.officeSecretary = {
        status: decision,
        decidedBy: secretaryId,
        decidedAt: new Date(),
        secretaryNote: (gatepass.course === 'PhD' && secretaryNote) ? secretaryNote.trim() : undefined,
    };

    // Update classes missed fields if provided (filled by office secretary)
    if (classesMissed && ['yes', 'no'].includes(classesMissed)) {
        gatepass.classesMissed = classesMissed;
    }
    if (missedDays !== undefined && missedDays !== null) {
        gatepass.missedDays = Number(missedDays);
    }

    // Save previous leaves taken (filled by office secretary)
    if (previousLeavesTaken && previousLeavesTaken.trim()) {
        gatepass.previousLeavesTaken = previousLeavesTaken.trim();
    }

    // Save PhD leave balance (filled by office secretary for PhD students)
    if (phdLeaveBalance && gatepass.course === 'PhD') {
        gatepass.phdLeaveBalance = {
            cl: phdLeaveBalance.cl || null,
            medical: phdLeaveBalance.medical || null,
            other: phdLeaveBalance.other || null,
            otherType: phdLeaveBalance.otherType || null,
        };
    }

    if (decision === 'approved') {
        // PhD students go to DPGC, others go to DUGC
        if (gatepass.course === 'PhD') {
            gatepass.currentStage = 'dpgc';
        } else {
            gatepass.currentStage = 'dugc';
        }
    } else {
        // Rejected - end the workflow
        gatepass.finalStatus = 'rejected';
        gatepass.currentStage = 'completed';
        gatepass.rejectionReason = rejectionReason.trim();
        gatepass.rejectedBy = {
            stage: 'officeSecretary',
            decidedBy: secretaryId,
            decidedAt: new Date(),
        };
    }

    await gatepass.save();

    // Send email notifications
    try {
        // Get student email for rejection notification
        const studentData = await User.findById(gatepass.student).select('email');
        
        if (decision === 'approved') {
            // PhD students: Send email to DPGC, Others: Send to DUGC
            if (gatepass.course === 'PhD') {
                const dpgc = await Dpgc.findOne({ department: gatepass.department }).select('name email');
                if (dpgc && dpgc.email) {
                    const reviewLink = `${process.env.FRONTEND_URL || 'https://gothru.vercel.app'}/dpgc/outstation`;
                    await sendOutstationGatepassNotification({
                        to: dpgc.email,
                        approverName: dpgc.name,
                        approverRole: 'DPGC',
                        studentName: gatepass.studentName,
                        rollnumber: gatepass.rollnumber,
                        department: gatepass.department,
                        branch: gatepass.branch,
                        roomNumber: gatepass.roomNumber,
                        contact: gatepass.contact,
                        reasonOfLeave: gatepass.reasonOfLeave,
                        address: gatepass.address,
                        dateOut: gatepass.dateOut,
                        dateIn: gatepass.dateIn,
                        classesMissed: gatepass.classesMissed,
                        missedDays: gatepass.missedDays,
                        forwardedBy: 'Office Secretary',
                        reviewLink,
                    });
                }
            } else {
                // Send email to DUGC of the same department for BTech/MBA
                const dugc = await Dugc.findOne({ department: gatepass.department }).select('name email');
                if (dugc && dugc.email) {
                    const reviewLink = `${process.env.FRONTEND_URL || 'https://gothru.vercel.app'}/dugc/outstation`;
                    await sendOutstationGatepassNotification({
                        to: dugc.email,
                        approverName: dugc.name,
                        approverRole: 'DUGC',
                        studentName: gatepass.studentName,
                        rollnumber: gatepass.rollnumber,
                        department: gatepass.department,
                        branch: gatepass.branch,
                        roomNumber: gatepass.roomNumber,
                        contact: gatepass.contact,
                        reasonOfLeave: gatepass.reasonOfLeave,
                        address: gatepass.address,
                        dateOut: gatepass.dateOut,
                        dateIn: gatepass.dateIn,
                        classesMissed: gatepass.classesMissed,
                        missedDays: gatepass.missedDays,
                        forwardedBy: 'Office Secretary',
                        reviewLink,
                    });
                }
            }
        } else {
            // Send rejection email to student
            if (studentData && studentData.email) {
                await sendOutstationRejectionNotification({
                    to: studentData.email,
                    studentName: gatepass.studentName,
                    rollnumber: gatepass.rollnumber,
                    rejectedByRole: 'Office Secretary',
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
            ? (gatepass.course === 'PhD' ? 'Gatepass approved and passed to DPGC' : 'Gatepass approved and passed to DUGC')
            : 'Gatepass rejected',
        gatepass: {
            _id: gatepass._id,
            currentStage: gatepass.currentStage,
            finalStatus: gatepass.finalStatus,
        },
    });
};

// Send meeting email to student
exports.sendMeetingEmail = async (req, res) => {
    const secretaryId = req.user.userId;
    const { gatepassId, meetingDate, meetingTime } = req.body;

    if (!gatepassId || !meetingDate || !meetingTime) {
        return res.status(400).json({ message: 'Gatepass ID, meeting date and time are required' });
    }

    // Get secretary's department
    const secretary = await OfficeSecretary.findById(secretaryId).select('department');
    if (!secretary) {
        return res.status(404).json({ message: 'Secretary not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'email name');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify secretary can only send email for gatepasses from their department
    if (gatepass.department !== secretary.department) {
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
            senderRole: 'Office Secretary',
            departmentName: `${secretary.department} Department`,
        });

        return res.json({ message: 'Meeting invitation email sent successfully' });
    } catch (err) {
        console.error('Error sending meeting email:', err);
        return res.status(500).json({ message: 'Failed to send email. Please try again.' });
    }
};

