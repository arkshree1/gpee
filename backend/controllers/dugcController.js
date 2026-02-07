const OutstationGatepass = require('../models/OutstationGatepass');
const Dugc = require('../models/Dugc');
const Hod = require('../models/Hod');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendMeetingInviteEmail, sendOutstationGatepassNotification, sendOutstationRejectionNotification } = require('../utils/emailService');

// Get DUGC profile (name, department, and email)
exports.getProfile = async (req, res) => {
    const dugcId = req.user.userId;

    const dugc = await Dugc.findById(dugcId).select('name department email');
    if (!dugc) {
        return res.status(404).json({ message: 'DUGC not found' });
    }

    return res.json({ name: dugc.name, department: dugc.department, email: dugc.email });
};

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
        .populate('student', 'imageUrl')
        .select('-__v');

    return res.json({ gatepasses });
};

// Approve or reject an outstation gatepass
exports.decideGatepass = async (req, res) => {
    const dugcId = req.user.userId;
    const { gatepassId, decision, rejectionReason, dugcNote } = req.body;

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

    // Save DUGC note for PhD students (shown to HOD)
    if (dugcNote && dugcNote.trim() && gatepass.course === 'PhD') {
        gatepass.dugcNote = dugcNote.trim();
    }

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

    // Send email notifications
    try {
        // Get student email for rejection notification
        const studentData = await User.findById(gatepass.student).select('email');
        
        if (decision === 'approved') {
            // Send email to HOD of the same department
            const hod = await Hod.findOne({ department: gatepass.department }).select('name email');
            if (hod && hod.email) {
                const reviewLink = `${process.env.FRONTEND_URL || 'https://gothru.vercel.app'}/hod/outstation`;
                await sendOutstationGatepassNotification({
                    to: hod.email,
                    approverName: hod.name,
                    approverRole: 'Head of Department',
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
                    forwardedBy: 'DUGC',
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
                    rejectedByRole: 'DUGC',
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
            ? 'Gatepass approved and passed to HOD'
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
    const dugcId = req.user.userId;
    const { gatepassId, meetingDate, meetingTime } = req.body;

    if (!gatepassId || !meetingDate || !meetingTime) {
        return res.status(400).json({ message: 'Gatepass ID, meeting date and time are required' });
    }

    // Get DUGC's department
    const dugc = await Dugc.findById(dugcId).select('department');
    if (!dugc) {
        return res.status(404).json({ message: 'DUGC not found' });
    }

    const gatepass = await OutstationGatepass.findById(gatepassId)
        .populate('student', 'email name');

    if (!gatepass) {
        return res.status(404).json({ message: 'Gatepass not found' });
    }

    // Verify DUGC can only send email for gatepasses from their department
    if (gatepass.department !== dugc.department) {
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
            senderRole: 'DUGC (Dean Undergraduate Committee)',
            departmentName: `${dugc.department} Department`,
        });

        return res.json({ message: 'Meeting invitation email sent successfully' });
    } catch (err) {
        console.error('Error sending meeting email:', err);
        return res.status(500).json({ message: 'Failed to send email. Please try again.' });
    }
};

// Update DUGC profile (email and/or password)
exports.updateProfile = async (req, res) => {
    const dugcId = req.user.userId;
    const { email, currentPassword, newPassword } = req.body;

    const dugc = await Dugc.findById(dugcId);
    if (!dugc) {
        return res.status(404).json({ message: 'DUGC not found' });
    }

    // If updating password, verify current password first
    if (newPassword) {
        if (!currentPassword) {
            return res.status(400).json({ message: 'Current password is required to set a new password' });
        }
        const isMatch = await dugc.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        dugc.password = await bcrypt.hash(newPassword, 10);
    }

    // If updating email
    if (email && email !== dugc.email) {
        // Check if email is already in use
        const existingDugc = await Dugc.findOne({ email: email.toLowerCase(), _id: { $ne: dugcId } });
        if (existingDugc) {
            return res.status(400).json({ message: 'Email is already in use' });
        }
        dugc.email = email.toLowerCase();
    }

    await dugc.save();

    return res.json({ 
        message: 'Profile updated successfully',
        email: dugc.email
    });
};
