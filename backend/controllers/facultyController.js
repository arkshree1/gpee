const OutstationGatepass = require('../models/OutstationGatepass');
const Faculty = require('../models/Faculty');
const OfficeSecretary = require('../models/OfficeSecretary');
const User = require('../models/User');
const { sendMeetingInviteEmail, sendOutstationGatepassNotification, sendOutstationRejectionNotification } = require('../utils/emailService');

// Get Faculty profile (name and department)
exports.getProfile = async (req, res) => {
    const facultyId = req.user.userId;

    const faculty = await Faculty.findById(facultyId).select('name department');
    if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
    }

    return res.json({ name: faculty.name, department: faculty.department });
};

// Get all faculties (for instructor dropdown in PhD application)
exports.getAllFaculties = async (req, res) => {
    const faculties = await Faculty.find({})
        .select('name department _id')
        .sort({ department: 1, name: 1 });

    return res.json({ faculties });
};

// Get pending outstation gatepasses where this faculty is the instructor
exports.getPendingGatepasses = async (req, res) => {
    const facultyId = req.user.userId;

    const gatepasses = await OutstationGatepass.find({
        currentStage: 'instructor',
        instructor: facultyId,
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
    const facultyId = req.user.userId;
    const { gatepassId } = req.params;

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'imageUrl name rollnumber branch department course');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify faculty is the instructor for this gatepass
    if (gatepass.instructor?.toString() !== facultyId) {
        return res.status(403).json({ message: 'Not authorized to view this gatepass' });
    }

    return res.json({ gatepass });
};

// Get student's OS gatepass history
exports.getStudentOSHistory = async (req, res) => {
    const { studentId } = req.params;

    // Get all OS gatepasses by this student
    const gatepasses = await OutstationGatepass.find({
        student: studentId,
    })
        .sort({ createdAt: -1 })
        .select('gatePassNo currentStage finalStatus stageStatus createdAt dateOut dateIn reasonOfLeave address classesMissed missedDays');

    return res.json({ gatepasses });
};

// Get gatepass history for this faculty (as instructor)
exports.getGatepassHistory = async (req, res) => {
    const facultyId = req.user.userId;
    const { search } = req.query;

    let query = {
        instructor: facultyId,
        'stageStatus.instructor.status': { $in: ['approved', 'rejected'] },
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
        .sort({ 'stageStatus.instructor.decidedAt': -1, createdAt: -1 })
        .populate('student', 'imageUrl')
        .select('-__v');

    return res.json({ gatepasses });
};

// Approve or reject an outstation gatepass
exports.decideGatepass = async (req, res) => {
    const facultyId = req.user.userId;
    const { gatepassId, decision, instructorNote, rejectionReason } = req.body;

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

    const faculty = await Faculty.findById(facultyId).select('name department');
    if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId);

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify faculty is the instructor for this gatepass
    if (gatepass.instructor?.toString() !== facultyId) {
        return res.status(403).json({ message: 'You are not the instructor for this gatepass' });
    }

    if (gatepass.currentStage !== 'instructor') {
        return res.status(400).json({ message: 'This gatepass is not at instructor stage' });
    }

    // Update stage status
    gatepass.stageStatus.instructor = {
        status: decision,
        decidedBy: facultyId,
        decidedAt: new Date(),
    };

    // Save instructor note if provided
    if (instructorNote && instructorNote.trim()) {
        gatepass.instructorNote = instructorNote.trim();
    }

    if (decision === 'approved') {
        // Move to next stage (Office Secretary of student's department)
        gatepass.currentStage = 'officeSecretary';
    } else {
        // Rejected - end the workflow
        gatepass.finalStatus = 'rejected';
        gatepass.currentStage = 'completed';
        gatepass.rejectionReason = rejectionReason.trim();
        gatepass.rejectedBy = {
            stage: 'instructor',
            decidedBy: facultyId,
            decidedAt: new Date(),
        };
    }

    await gatepass.save();

    // Send email notifications
    try {
        // Get student email for rejection notification
        const studentData = await User.findById(gatepass.student).select('email');

        if (decision === 'approved') {
            // Send email to Office Secretary of the STUDENT's department (not instructor's department)
            const officeSecretary = await OfficeSecretary.findOne({ department: gatepass.department }).select('name email');
            if (officeSecretary && officeSecretary.email) {
                const reviewLink = `${process.env.FRONTEND_URL || 'https://gothru.vercel.app'}/office-secretary/outstation`;
                await sendOutstationGatepassNotification({
                    to: officeSecretary.email,
                    approverName: officeSecretary.name,
                    approverRole: 'Office Secretary',
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
                    forwardedBy: `Instructor (${faculty.name})`,
                    reviewLink,
                });
            }
        } else {
            // Send rejection email to student
            if (studentData && studentData.email) {
                await sendOutstationRejectionNotification({
                    to: studentData.email,
                    studentName: gatepass.studentName,
                    rollnumber: gatepass.rollnumber,
                    rejectedByRole: 'Instructor',
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
            ? 'Gatepass approved and passed to Office Secretary'
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
    const facultyId = req.user.userId;
    const { gatepassId, meetingDate, meetingTime } = req.body;

    if (!gatepassId || !meetingDate || !meetingTime) {
        return res.status(400).json({ message: 'Gatepass ID, meeting date and time are required' });
    }

    const faculty = await Faculty.findById(facultyId).select('name department');
    if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'email name');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify faculty is the instructor for this gatepass
    if (gatepass.instructor?.toString() !== facultyId) {
        return res.status(403).json({ message: 'You are not the instructor for this gatepass' });
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
            senderRole: 'Instructor',
            departmentName: `${faculty.name} (Faculty)`,
        });

        return res.json({ message: 'Meeting invitation email sent successfully' });
    } catch (err) {
        console.error('Error sending meeting email:', err);
        return res.status(500).json({ message: 'Failed to send email. Please try again.' });
    }
};
