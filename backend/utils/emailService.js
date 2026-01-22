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
 * Send meeting invitation email to student regarding outstation gatepass
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

module.exports = {
  sendMeetingInviteEmail,
};
