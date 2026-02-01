const nodemailer = require('nodemailer');

// Use same email config as authController
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

/**
 * Send meeting invttitation email to student regarding outstation gatepass
 * @param {Object} options
 * @param {string} options.to - Student's email
 * @param {string} options.studentName - Student's name
 * @param {string} options.meetingDate - Meeting date (DD/MM/YYYY format)
 * @param {string} options.meetingTime - Meeting time (e.g., "10:30 AM")
 * @param {string} options.senderRole - Role of sender (e.g., "Head of the Department", "DUGC", "Office Secretary")
 * @param {string} options.departmentName - Department name
 */
const sendMeetingInviteEmail = async ({ to, studentName, meetingDate, meetingTime, senderRole, departmentName }) => {
  if (!emailUser || !emailPass) {
    console.error('EMAIL_USER or EMAIL_PASS is not set in .env, cannot send email');
    throw new Error('Email configuration is missing');
  }

  const subject = 'Regarding Outstation Leave Gate Pass - RGIPT';
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 25px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 600;">RAJIV GANDHI INSTITUTE OF PETROLEUM TECHNOLOGY</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">An Institute of National Importance</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px 35px;">
        <h2 style="color: #1a365d; font-size: 18px; margin: 0 0 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
          Regarding Outstation Leave Gate Pass
        </h2>
        
        <p style="color: #2d3748; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
          Dear <strong style="color: #1a365d;">${studentName}</strong>,
        </p>
        
        <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
          This is to inform you that your outstation gate pass application for leave has been received.
        </p>
        
        <div style="background: linear-gradient(135deg, #ebf8ff 0%, #e6fffa 100%); border-left: 4px solid #3182ce; padding: 20px 25px; border-radius: 0 8px 8px 0; margin: 25px 0;">
          <p style="color: #2b6cb0; font-size: 15px; margin: 0 0 12px; font-weight: 600;">
            You are requested to visit my office on:
          </p>
          <div style="display: flex; gap: 30px; flex-wrap: wrap;">
            <div>
              <span style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date</span>
              <p style="color: #1a365d; font-size: 18px; font-weight: 700; margin: 5px 0 0;">${meetingDate}</p>
            </div>
            <div>
              <span style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Time</span>
              <p style="color: #1a365d; font-size: 18px; font-weight: 700; margin: 5px 0 0;">${meetingTime}</p>
            </div>
          </div>
        </div>
        
        <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 20px 0;">
          Please carry any relevant documents, if required.
        </p>
        
        <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 25px;">
          Kindly make it convenient to attend.
        </p>
        
        <!-- Signature -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #4a5568; font-size: 14px; margin: 0 0 5px;">Regards,</p>
          <p style="color: #1a365d; font-size: 16px; font-weight: 600; margin: 8px 0 5px;">${senderRole}</p>
          <p style="color: #718096; font-size: 14px; margin: 0;">${departmentName}</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f7fafc; padding: 20px 35px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">
          This is an automated email from GoThru - RGIPT Gate Pass System.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
  
  try {
    await transporter.sendMail({
      from: `GoThru - RGIPT <${emailUser}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Error sending meeting invite email:', err);
    throw err;
  }
};

/**
 * Send notification email to Hostel Office about new local gatepass request
 * @param {Object} options
 * @param {string} options.to - Hostel Office email
 * @param {string} options.studentName - Student's name
 * @param {string} options.rollnumber - Student's roll number
 * @param {string} options.department - Student's department
 * @param {string} options.roomNumber - Student's room number
 * @param {string} options.gatePassNo - Gate pass number (L-XXXXX)
 * @param {string} options.purpose - Purpose of leave
 * @param {string} options.place - Destination
 * @param {string} options.dateOut - Date of going out
 * @param {string} options.timeOut - Time of going out
 * @param {string} options.dateIn - Date of return
 * @param {string} options.timeIn - Time of return
 * @param {string} options.reviewLink - Link to review/approve/reject the gatepass
 */
const sendLocalGatepassNotification = async ({
  to,
  studentName,
  rollnumber,
  department,
  roomNumber,
  gatePassNo,
  purpose,
  place,
  dateOut,
  timeOut,
  dateIn,
  timeIn,
  reviewLink,
}) => {
  if (!emailUser || !emailPass) {
    console.error('EMAIL_USER or EMAIL_PASS is not set in .env, cannot send email');
    throw new Error('Email configuration is missing');
  }

  //hey
  const subject = `New Local Gatepass Request - ${gatePassNo} | ${studentName}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #f7882f 0%, #f78f2f 100%); padding: 25px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 600;">GoThru - Gate Pass System</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px;">RGIPT Campus Access Management</p>
      </div>
      
      <!-- Alert Banner -->
      <div style="background: #fff3cd; padding: 15px 35px; border-bottom: 1px solid #ffc107;">
        <p style="color: #856404; font-size: 14px; margin: 0; font-weight: 600;">
          📋 New Local Gatepass Request Received
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px 35px;">
        <h2 style="color: #1a365d; font-size: 18px; margin: 0 0 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
          Request Details - ${gatePassNo}
        </h2>
        
        <!-- Student Info Card -->
        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #4a5568; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px;">Student Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px; width: 40%;">Name</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Roll Number</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${rollnumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Department</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${department}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Room Number</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${roomNumber}</td>
            </tr>
          </table>
        </div>
        
        <!-- Leave Details Card -->
        <div style="background: #ebf8ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #2b6cb0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px;">Leave Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px; width: 40%;">Purpose</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${purpose}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Destination</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${place}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Going Out</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${dateOut} at ${timeOut}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Expected Return</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${dateIn} at ${timeIn}</td>
            </tr>
          </table>
        </div>
        
        <!-- Action Button -->
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #4a5568; font-size: 14px; margin: 0 0 15px;">
            Please review and take action on this request:
          </p>
          <a href="${reviewLink}" style="display: inline-block; background: linear-gradient(135deg, #f7882f 0%, #e67300 100%); color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(247, 136, 47, 0.3);">
            Review & Approve/Reject
          </a>
        </div>
        
        <p style="color: #718096; font-size: 13px; text-align: center; margin: 20px 0 0;">
          If the button doesn't work, copy and paste this link in your browser:<br>
          <a href="${reviewLink}" style="color: #3182ce; word-break: break-all;">${reviewLink}</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f7fafc; padding: 20px 35px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">
          This is an automated email from GoThru - RGIPT Gate Pass System.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
  
  try {
    await transporter.sendMail({
      from: `GoThru - RGIPT <${emailUser}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Error sending local gatepass notification email:', err);
    throw err;
  }
};

/**
 * Send notification email to approving authority about new/forwarded outstation gatepass
 * @param {Object} options
 * @param {string} options.to - Approver's email
 * @param {string} options.approverName - Name of the approving authority
 * @param {string} options.approverRole - Role (Office Secretary, DUGC, HOD, Hostel Office)
 * @param {string} options.studentName - Student's name
 * @param {string} options.rollnumber - Student's roll number
 * @param {string} options.department - Student's department
 * @param {string} options.branch - Student's branch/course
 * @param {string} options.roomNumber - Student's room number
 * @param {string} options.contact - Student's contact number
 * @param {string} options.reasonOfLeave - Reason for leave
 * @param {string} options.address - Destination address
 * @param {string} options.dateOut - Date of going out
 * @param {string} options.dateIn - Date of return
 * @param {number} options.classesMissed - Number of classes to be missed
 * @param {number} options.missedDays - Number of days
 * @param {string} options.forwardedBy - Who forwarded (e.g., "Office Secretary", "DUGC", "HOD") - optional for initial submission
 * @param {string} options.reviewLink - Link to review the gatepass
 */
const sendOutstationGatepassNotification = async ({
  to,
  approverName,
  approverRole,
  studentName,
  rollnumber,
  department,
  branch,
  roomNumber,
  contact,
  reasonOfLeave,
  address,
  dateOut,
  dateIn,
  classesMissed,
  missedDays,
  forwardedBy,
  reviewLink,
}) => {
  if (!emailUser || !emailPass) {
    console.error('EMAIL_USER or EMAIL_PASS is not set in .env, cannot send email');
    throw new Error('Email configuration is missing');
  }

  const isNewRequest = !forwardedBy;
  const subject = isNewRequest 
    ? `New Outstation Gatepass Request | ${studentName} (${rollnumber})`
    : `Outstation Gatepass Forwarded by ${forwardedBy} | ${studentName} (${rollnumber})`;
  
  const headerText = isNewRequest 
    ? '📋 New Outstation Gatepass Request'
    : `📋 Gatepass Forwarded by ${forwardedBy}`;
    
  const introText = isNewRequest
    ? `A new outstation gatepass request has been submitted by <strong>${studentName}</strong> and requires your review.`
    : `An outstation gatepass request from <strong>${studentName}</strong> has been approved and forwarded by ${forwardedBy} for your review.`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 25px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 600;">GoThru - Outstation Gate Pass</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px;">RGIPT Campus Access Management</p>
      </div>
      
      <!-- Alert Banner -->
      <div style="background: ${isNewRequest ? '#fff3cd' : '#d4edda'}; padding: 15px 35px; border-bottom: 1px solid ${isNewRequest ? '#ffc107' : '#28a745'};">
        <p style="color: ${isNewRequest ? '#856404' : '#155724'}; font-size: 14px; margin: 0; font-weight: 600;">
          ${headerText}
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px 35px;">
        <p style="color: #2d3748; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
          Dear <strong style="color: #1a365d;">${approverName || approverRole}</strong>,
        </p>
        
        <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
          ${introText}
        </p>
        
        <!-- Student Info Card -->
        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #4a5568; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px;">Student Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px; width: 40%;">Name</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Roll Number</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${rollnumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Department</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${department}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Branch/Course</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${branch || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Room Number</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${roomNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Contact</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${contact}</td>
            </tr>
          </table>
        </div>
        
        <!-- Leave Details Card -->
        <div style="background: #ebf8ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #2b6cb0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px;">Leave Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px; width: 40%;">Reason of Leave</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${reasonOfLeave}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Destination</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${address}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Date of Leaving</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${dateOut}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Expected Return</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${dateIn}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Days of Leave</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${missedDays || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Classes to be Missed</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${classesMissed || 'N/A'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Action Button -->
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #4a5568; font-size: 14px; margin: 0 0 15px;">
            Please review and take action on this request:
          </p>
          <a href="${reviewLink}" style="display: inline-block; background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(26, 54, 93, 0.3);">
            Review Request
          </a>
        </div>
        
        <p style="color: #718096; font-size: 13px; text-align: center; margin: 20px 0 0;">
          If the button doesn't work, copy and paste this link in your browser:<br>
          <a href="${reviewLink}" style="color: #3182ce; word-break: break-all;">${reviewLink}</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f7fafc; padding: 20px 35px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">
          This is an automated email from GoThru - RGIPT Gate Pass System.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
  
  try {
    await transporter.sendMail({
      from: `GoThru - RGIPT <${emailUser}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Error sending outstation gatepass notification email:', err);
    throw err;
  }
};

/**
 * Send rejection notification email to student about their outstation gatepass
 * @param {Object} options
 * @param {string} options.to - Student's email
 * @param {string} options.studentName - Student's name
 * @param {string} options.rollnumber - Student's roll number
 * @param {string} options.rejectedByRole - Role that rejected (Office Secretary, DUGC, HOD, Hostel Office)
 * @param {string} options.rejectionReason - Reason for rejection
 * @param {string} options.dateOut - Requested date of leaving
 * @param {string} options.dateIn - Requested date of return
 * @param {string} options.reasonOfLeave - Original reason for leave
 * @param {string} options.address - Destination address
 */
const sendOutstationRejectionNotification = async ({
  to,
  studentName,
  rollnumber,
  rejectedByRole,
  rejectionReason,
  dateOut,
  dateIn,
  reasonOfLeave,
  address,
}) => {
  if (!emailUser || !emailPass) {
    console.error('EMAIL_USER or EMAIL_PASS is not set in .env, cannot send email');
    throw new Error('Email configuration is missing');
  }

  const subject = `Outstation Gatepass Request Rejected | ${rejectedByRole}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 25px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 600;">GoThru - Outstation Gate Pass</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px;">RGIPT Campus Access Management</p>
      </div>
      
      <!-- Alert Banner -->
      <div style="background: #f8d7da; padding: 15px 35px; border-bottom: 1px solid #f5c6cb;">
        <p style="color: #721c24; font-size: 14px; margin: 0; font-weight: 600;">
          ❌ Outstation Gatepass Request Rejected
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px 35px;">
        <p style="color: #2d3748; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
          Dear <strong style="color: #1a365d;">${studentName}</strong>,
        </p>
        
        <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
          We regret to inform you that your outstation gatepass request has been <strong style="color: #c53030;">rejected</strong> by the <strong>${rejectedByRole}</strong>.
        </p>
        
        <!-- Rejection Reason Card -->
        <div style="background: #fff5f5; border-left: 4px solid #c53030; border-radius: 0 8px 8px 0; padding: 20px 25px; margin: 25px 0;">
          <h3 style="color: #c53030; font-size: 14px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Reason for Rejection</h3>
          <p style="color: #742a2a; font-size: 15px; margin: 0; line-height: 1.7;">${rejectionReason}</p>
        </div>
        
        <!-- Request Details Card -->
        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #4a5568; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px;">Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px; width: 40%;">Roll Number</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${rollnumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Reason of Leave</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${reasonOfLeave}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Destination</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${address}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Requested Dates</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${dateOut} to ${dateIn}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 20px 0;">
          If you believe this rejection was made in error, or if you have additional information to provide, please contact the respective office directly.
        </p>
        
        <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0;">
          You may also submit a new request with the necessary modifications.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f7fafc; padding: 20px 35px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">
          This is an automated email from GoThru - RGIPT Gate Pass System.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
  
  try {
    await transporter.sendMail({
      from: `GoThru - RGIPT <${emailUser}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Error sending outstation rejection notification email:', err);
    throw err;
  }
};

/**
 * Send approval notification email to student about their outstation gatepass
 * @param {Object} options
 * @param {string} options.to - Student's email
 * @param {string} options.studentName - Student's name
 * @param {string} options.rollnumber - Student's roll number
 * @param {string} options.gatePassNo - Gatepass number (OS-XXXXX)
 * @param {string} options.dateOut - Date of leaving
 * @param {string} options.dateIn - Date of return
 * @param {string} options.reasonOfLeave - Reason for leave
 * @param {string} options.address - Destination address
 */
const sendOutstationApprovalNotification = async ({
  to,
  studentName,
  rollnumber,
  gatePassNo,
  dateOut,
  dateIn,
  reasonOfLeave,
  address,
}) => {
  if (!emailUser || !emailPass) {
    console.error('EMAIL_USER or EMAIL_PASS is not set in .env, cannot send email');
    throw new Error('Email configuration is missing');
  }

  const subject = `Outstation Gatepass Approved - ${gatePassNo}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 25px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 600;">GoThru - Outstation Gate Pass</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px;">RGIPT Campus Access Management</p>
      </div>
      
      <!-- Alert Banner -->
      <div style="background: #d4edda; padding: 15px 35px; border-bottom: 1px solid #28a745;">
        <p style="color: #155724; font-size: 14px; margin: 0; font-weight: 600;">
          ✅ Outstation Gatepass Request Approved
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px 35px;">
        <p style="color: #2d3748; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
          Dear <strong style="color: #1a365d;">${studentName}</strong>,
        </p>
        
        <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
          It is to inform you that your outstation gatepass request has been <strong style="color: #276749;">approved</strong>. Below are the details of your approved gatepass:
        </p>
        
        <!-- Gatepass Number Card -->
        <div style="background: linear-gradient(135deg, #e6fffa 0%, #ebf8ff 100%); border: 2px solid #38b2ac; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <p style="color: #285e61; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px;">Your Gatepass Number</p>
          <h2 style="color: #234e52; font-size: 32px; margin: 0; font-weight: 700; letter-spacing: 3px;">${gatePassNo}</h2>
        </div>
        
        <!-- Request Details Card -->
        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #4a5568; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px;">Approved Leave Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px; width: 40%;">Roll Number</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${rollnumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Reason of Leave</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${reasonOfLeave}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Destination</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${address}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-size: 14px;">Approved Dates</td>
              <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600;">${dateOut} to ${dateIn}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #4a5568; font-size: 15px; line-height: 1.8; margin: 20px 0 0;">
          Happy and safe journey!
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f7fafc; padding: 20px 35px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 12px; color: #a0aec0; text-align: center; margin: 0;">
          This is an automated email from GoThru - RGIPT Gate Pass System.<br>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
  
  try {
    await transporter.sendMail({
      from: `GoThru - RGIPT <${emailUser}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Error sending outstation approval notification email:', err);
    throw err;
  }
};

/**
 * Send notification to student when Office Secretary edits their gatepass details
 * @param {Object} options
 * @param {string} options.to - Student email
 * @param {string} options.studentName - Student name
 * @param {string} options.rollnumber - Student roll number
 * @param {Object} options.changes - Object containing old and new values for changed fields
 * @param {string} options.editedBy - Name of the secretary who made the edit
 */
const sendGatepassEditNotification = async ({
  to,
  studentName,
  rollnumber,
  changes,
  editedBy,
}) => {
  if (!emailUser || !emailPass) {
    console.error('EMAIL_USER or EMAIL_PASS is not set in .env, cannot send email');
    throw new Error('Email configuration is missing');
  }

  const subject = `Gatepass Details Updated by Office Secretary | ${studentName} (${rollnumber})`;

  // Build the changes list HTML
  let changesHtml = '';
  if (changes.leaveDays) {
    changesHtml += `
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">Leave Days</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; color: #dc3545; text-decoration: line-through;">${changes.leaveDays.old}</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; color: #28a745; font-weight: 600;">${changes.leaveDays.new}</td>
      </tr>`;
  }
  if (changes.dateOut) {
    changesHtml += `
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">Exit Date</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; color: #dc3545; text-decoration: line-through;">${changes.dateOut.old}</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; color: #28a745; font-weight: 600;">${changes.dateOut.new}</td>
      </tr>`;
  }
  if (changes.timeOut) {
    changesHtml += `
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">Exit Time</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; color: #dc3545; text-decoration: line-through;">${changes.timeOut.old}</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; color: #28a745; font-weight: 600;">${changes.timeOut.new}</td>
      </tr>`;
  }
  if (changes.dateIn) {
    changesHtml += `
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">Return Date</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; color: #dc3545; text-decoration: line-through;">${changes.dateIn.old}</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; color: #28a745; font-weight: 600;">${changes.dateIn.new}</td>
      </tr>`;
  }
  if (changes.timeIn) {
    changesHtml += `
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">Return Time</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; color: #dc3545; text-decoration: line-through;">${changes.timeIn.old}</td>
        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; color: #28a745; font-weight: 600;">${changes.timeIn.new}</td>
      </tr>`;
  }

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 25px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 600;">GoThru - Outstation Gate Pass</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px;">RGIPT Campus Access Management</p>
      </div>
      
      <!-- Alert Banner -->
      <div style="background: #e7f3ff; padding: 15px 35px; border-bottom: 1px solid #007bff;">
        <p style="color: #004085; font-size: 14px; margin: 0; font-weight: 600;">
          ✏️ Your Gatepass Details Have Been Updated
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px 35px;">
        <p style="color: #4a5568; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
          Dear <strong>${studentName}</strong>,
        </p>
        
        <p style="color: #4a5568; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
          The Office Secretary (<strong>${editedBy}</strong>) has made changes to your outstation gatepass application. Please review the updated details below:
        </p>
        
        <!-- Changes Table -->
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #dee2e6;">Field</th>
              <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #dee2e6;">Previous</th>
              <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #dee2e6;">Updated</th>
            </tr>
          </thead>
          <tbody>
            ${changesHtml}
          </tbody>
        </table>
        
        <p style="color: #4a5568; font-size: 14px; line-height: 1.7; margin: 20px 0 0;">
          If you have any questions regarding these changes, please contact the Office Secretary.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 20px 35px; border-top: 1px solid #e0e0e0; text-align: center;">
        <p style="color: #6c757d; font-size: 12px; margin: 0;">
          This is an automated message from GoThru Gate Pass System
        </p>
        <p style="color: #6c757d; font-size: 11px; margin: 10px 0 0;">
          © ${new Date().getFullYear()} RGIPT. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"GoThru Gate Pass" <${emailUser}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Error sending gatepass edit notification email:', err);
    throw err;
  }
};

module.exports = {
  sendMeetingInviteEmail,
  sendLocalGatepassNotification,
  sendOutstationGatepassNotification,
  sendOutstationRejectionNotification,
  sendOutstationApprovalNotification,
  sendGatepassEditNotification,
};

