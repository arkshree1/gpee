const OutstationGatepass = require('../models/OutstationGatepass');
const Dean = require('../models/Dean');
const HostelOffice = require('../models/HostelOffice');
const User = require('../models/User');
const { sendMeetingInviteEmail, sendOutstationGatepassNotification, sendOutstationRejectionNotification } = require('../utils/emailService');

// Get Dean profile
exports.getProfile = async (req, res) => {
    const deanId = req.user.userId;

    const dean = await Dean.findById(deanId).select('name');
    if (!dean) {
        return res.status(404).json({ message: 'Dean not found' });
    }

    return res.json({ name: dean.name, department: 'All Departments' });
};

// Get pending outstation gatepasses for Dean (all PhD students from all departments)
exports.getPendingGatepasses = async (req, res) => {
    const deanId = req.user.userId;

    // Verify dean exists
    const dean = await Dean.findById(deanId);
    if (!dean) {
        return res.status(404).json({ message: 'Dean not found' });
    }

    // Dean sees all PhD gatepasses at dean stage (no department filter)
    const gatepasses = await OutstationGatepass.find({
        currentStage: 'dean',
        course: 'PhD',
    })
        .sort({ createdAt: -1 })
        .select('studentName rollnumber course department branch contact roomNumber student createdAt instructorName instructorNote officeSecretaryNote dpgcNote hodNote phdLeaveBalance')
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
    const deanId = req.user.userId;
    const { gatepassId } = req.params;

    // Verify dean exists
    const dean = await Dean.findById(deanId);
    if (!dean) {
        return res.status(404).json({ message: 'Dean not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'imageUrl name rollnumber branch department course')
        .populate('instructor', 'name department');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Dean can view any PhD gatepass at dean stage
    if (gatepass.course !== 'PhD') {
        return res.status(403).json({ message: 'Dean can only view PhD gatepasses' });
    }

    return res.json({ gatepass });
};

// Get student's OS gatepass history (for view details page)
exports.getStudentOSHistory = async (req, res) => {
    const deanId = req.user.userId;
    const { studentId } = req.params;

    // Verify dean exists
    const dean = await Dean.findById(deanId);
    if (!dean) {
        return res.status(404).json({ message: 'Dean not found' });
    }

    // Get all OS gatepasses by this student
    const gatepasses = await OutstationGatepass.find({
        student: studentId,
    })
        .sort({ createdAt: -1 })
        .select('gatePassNo currentStage finalStatus stageStatus createdAt dateOut dateIn reasonOfLeave address classesMissed missedDays');

    return res.json({ gatepasses });
};

// Get gatepass history (approved and rejected by Dean)
exports.getGatepassHistory = async (req, res) => {
    const deanId = req.user.userId;
    const { search } = req.query;

    // Verify dean exists
    const dean = await Dean.findById(deanId);
    if (!dean) {
        return res.status(404).json({ message: 'Dean not found' });
    }

    let query = {
        course: 'PhD',
        'stageStatus.dean.status': { $in: ['approved', 'rejected'] },
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
        .sort({ 'stageStatus.dean.decidedAt': -1, createdAt: -1 })
        .populate('student', 'imageUrl')
        .select('-__v');

    return res.json({ gatepasses });
};

// Approve or reject an outstation gatepass
exports.decideGatepass = async (req, res) => {
    const deanId = req.user.userId;
    const { gatepassId, decision, deanNote, rejectionReason } = req.body;

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

    // Verify dean exists
    const dean = await Dean.findById(deanId).select('name');
    if (!dean) {
        return res.status(404).json({ message: 'Dean not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId);

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify this is a PhD gatepass
    if (gatepass.course !== 'PhD') {
        return res.status(403).json({ message: 'Dean can only manage PhD gatepasses' });
    }

    if (gatepass.currentStage !== 'dean') {
        return res.status(400).json({ message: 'This gatepass is not at Dean stage' });
    }

    // Update stage status
    gatepass.stageStatus.dean = {
        status: decision,
        decidedBy: deanId,
        decidedAt: new Date(),
    };

    // Save Dean note if provided
    if (deanNote && deanNote.trim()) {
        gatepass.deanNote = deanNote.trim();
    }

    if (decision === 'approved') {
        // Move to Hostel Office for final approval
        gatepass.currentStage = 'hostelOffice';
    } else {
        // Rejected - end the workflow
        gatepass.finalStatus = 'rejected';
        gatepass.currentStage = 'completed';
        gatepass.rejectionReason = rejectionReason.trim();
        gatepass.rejectedBy = {
            stage: 'dean',
            decidedBy: deanId,
            decidedAt: new Date(),
        };
    }

    await gatepass.save();

    // Send email notifications
    try {
        // Get student email for rejection notification
        const studentData = await User.findById(gatepass.student).select('email');

        if (decision === 'approved') {
            // Send email to ALL Hostel Office accounts
            const hostelOffices = await HostelOffice.find({}).select('email');
            if (hostelOffices && hostelOffices.length > 0) {
                const reviewLink = `${process.env.FRONTEND_URL || 'https://gothru.vercel.app'}/hostel-office/outstation`;
                for (const hostelOffice of hostelOffices) {
                    if (hostelOffice.email) {
                        await sendOutstationGatepassNotification({
                            to: hostelOffice.email,
                            approverName: 'Hostel Office',
                            approverRole: 'Hostel Office',
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
                            forwardedBy: 'Dean',
                            reviewLink,
                        });
                    }
                }
            }
        } else {
            // Send rejection email to student
            if (studentData && studentData.email) {
                await sendOutstationRejectionNotification({
                    to: studentData.email,
                    studentName: gatepass.studentName,
                    rollnumber: gatepass.rollnumber,
                    rejectedByRole: 'Dean',
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
            ? 'Gatepass approved and passed to Hostel Office'
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
    const deanId = req.user.userId;
    const { gatepassId, meetingDate, meetingTime } = req.body;

    if (!gatepassId || !meetingDate || !meetingTime) {
        return res.status(400).json({ message: 'Gatepass ID, meeting date and time are required' });
    }

    // Verify dean exists
    const dean = await Dean.findById(deanId);
    if (!dean) {
        return res.status(404).json({ message: 'Dean not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'email name');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify this is a PhD gatepass
    if (gatepass.course !== 'PhD') {
        return res.status(403).json({ message: 'Dean can only manage PhD gatepasses' });
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
            senderRole: 'Dean',
            departmentName: 'Dean Office',
        });

        return res.json({ message: 'Meeting invitation email sent successfully' });
    } catch (err) {
        console.error('Error sending meeting email:', err);
        return res.status(500).json({ message: 'Failed to send email. Please try again.' });
    }
};
