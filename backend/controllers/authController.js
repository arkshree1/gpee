const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Guard = require('../models/Guard');
const Admin = require('../models/Admin');
const OfficeSecretary = require('../models/OfficeSecretary');
const Hod = require('../models/Hod');
const Dugc = require('../models/Dugc');
const HostelOffice = require('../models/HostelOffice');
const Faculty = require('../models/Faculty');
const Dpgc = require('../models/Dpgc');
const Dean = require('../models/Dean');

// Real email sender using Nodemailer and environment variables
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

const sendEmail = async (to, subject, text) => {
  if (!emailUser || !emailPass) {
    console.error('EMAIL_USER or EMAIL_PASS is not set in .env, cannot send email');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `Student Portal <${emailUser}>`,
      to,
      subject,
      text,
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Map a specific branch string to its department
const getDepartmentFromBranch = (branch) => {
  switch (branch) {
    case 'Mathematics and Computing':
      return 'Mathematical Sciences';

    case 'Computer Science and Design Engineering':
    case 'Computer Science and Engineering':
    case 'Information Technology':
      return 'Computer Science and Engineering';

    case 'Chemical Engineering':
    case 'Chemical Engineering (Major: Renewable Energy Engineering)':
    case 'Chemical Engineering (Major: Petrochemicals and Polymers Engineering)':
      return 'Chemical and Biochemical Engineering';

    case 'Mechanical Engineering':
      return 'Mechanical Engineering';

    case 'Petroleum Engineering':
    case 'Petroleum Engineering (Major: Applied Petroleum Geoscience)':
      return 'Petroleum Engineering and Geoengineering';

    case 'Electrical Engineering (Major: E Vehicle Technology)':
    case 'Electronics Engineering':
      return 'Electrical and Electronics Engineering';

    case 'MBA':
      return 'Management Studies';

    case 'PhD':
      return 'PHD';

    case 'Energy and human sciences':
      return 'Energy and human sciences';

    default:
      return null;
  }
};

exports.signup = async (req, res) => {
  try {
    let { name, rollnumber, course, branch, department, email, password, confirmPassword, hostelName, roomNumber, contactNumber } = req.body;

    // Course-specific handling:
    // - BTech: branch is selected, department is derived from branch
    // - PhD: department is selected directly, branch is empty
    // - MBA: branch = "Management Studies", department = "Management Studies"
    if (course === 'MBA') {
      branch = 'Management Studies';
      department = 'Management Studies';
    } else if (course === 'PhD') {
      // PhD: department comes directly from form, branch stays empty
      branch = '';
      // department is already set from form
    } else if (course === 'BTech') {
      // BTech: derive department from branch selection
      department = getDepartmentFromBranch(branch);
    }

    // Branch is required only for BTech, Department is required only for PhD
    const branchRequired = course === 'BTech';
    const departmentRequired = course === 'PhD';
    if (!name || !rollnumber || !course || (branchRequired && !branch) || (departmentRequired && !department) || !email || !password || !confirmPassword || !hostelName || !roomNumber || !contactNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }


    if (!/^[A-Za-z0-9]+$/.test(rollnumber)) {
      return res.status(400).json({ message: 'Roll number must be alphanumeric (e.g. 23CD3037).' });
    }

    if (!/^\d{10}$/.test(contactNumber)) {
      return res.status(400).json({ message: 'Contact number must be 10 digits.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    // If user exists and is verified, reject
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    let user;

    if (existingUser && !existingUser.isVerified) {
      // User exists but not verified - update their data and resend OTP
      existingUser.name = name;
      existingUser.rollnumber = rollnumber;
      existingUser.course = course;
      existingUser.branch = branch;
      existingUser.department = department;
      existingUser.password = hashedPassword;
      existingUser.hostelName = hostelName;
      existingUser.roomNumber = roomNumber;
      existingUser.contactNumber = contactNumber;
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      if (imageUrl) existingUser.imageUrl = imageUrl;
      await existingUser.save();
      user = existingUser;
    } else {
      // New user - create account
      user = await User.create({
        name,
        rollnumber,
        course,
        branch,
        department,
        email: email.toLowerCase(),
        password: hashedPassword,
        imageUrl,
        hostelName,
        roomNumber,
        contactNumber,
        otp,
        otpExpires,
        isVerified: false,
      });
    }

    // Send OTP email asynchronously so signup response is faster
    sendEmail(
      user.email,
      'Your OTP for account verification',
      `Your OTP is ${otp}. It is valid for 10 minutes.`
    ).catch((emailError) => {
      console.error('Error sending OTP email:', emailError);
    });

    return res.status(201).json({
      message: 'Signup successful. OTP sent to email.',
      email: user.email,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error during signup' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'Invalid OTP request' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;
    await user.save();

    return res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();

    // 1) Guard login (separate Guard collection)
    const guard = await Guard.findOne({ email: normalizedEmail });
    if (guard) {
      const isMatch = await guard.comparePassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        {
          userId: guard._id,
          role: 'guard',
          userType: 'guard',
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      return res.json({ message: 'Login successful', token });
    }

    // 2) Admin login (separate Admin collection)
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (admin) {
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        {
          userId: admin._id,
          role: 'admin',
          userType: 'admin',
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      return res.json({ message: 'Login successful', token });
    }

    // 3) Office Secretary login
    const officeSecretary = await OfficeSecretary.findOne({ email: normalizedEmail });
    if (officeSecretary) {
      const isMatch = await officeSecretary.comparePassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        {
          userId: officeSecretary._id,
          role: 'officeSecretary',
          userType: 'officeSecretary',
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      return res.json({ message: 'Login successful', token });
    }

    // 4) HOD login
    const hod = await Hod.findOne({ email: normalizedEmail });
    if (hod) {
      const isMatch = await hod.comparePassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        {
          userId: hod._id,
          role: 'hod',
          userType: 'hod',
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      return res.json({ message: 'Login successful', token });
    }

    // 5) DUGC login
    const dugc = await Dugc.findOne({ email: normalizedEmail });
    if (dugc) {
      const isMatch = await dugc.comparePassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        {
          userId: dugc._id,
          role: 'dugc',
          userType: 'dugc',
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      return res.json({ message: 'Login successful', token });
    }

    // 6) Hostel Office login
    const hostelOffice = await HostelOffice.findOne({ email: normalizedEmail });
    if (hostelOffice) {
      const isMatch = await hostelOffice.comparePassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        {
          userId: hostelOffice._id,
          role: 'hostelOffice',
          userType: 'hostelOffice',
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      return res.json({ message: 'Login successful', token });
    }

    // 7) Faculty login (for PhD instructor approval)
    const faculty = await Faculty.findOne({ email: normalizedEmail });
    if (faculty) {
      const isMatch = await faculty.comparePassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        {
          userId: faculty._id,
          role: 'faculty',
          userType: 'faculty',
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      return res.json({ message: 'Login successful', token });
    }

    // 8) DPGC login (for PhD approval)
    const dpgc = await Dpgc.findOne({ email: normalizedEmail });
    if (dpgc) {
      const isMatch = await dpgc.comparePassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        {
          userId: dpgc._id,
          role: 'dpgc',
          userType: 'dpgc',
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      return res.json({ message: 'Login successful', token });
    }

    // 9) Dean login (for PhD final approval)
    const dean = await Dean.findOne({ email: normalizedEmail });
    if (dean) {
      const isMatch = await dean.comparePassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign(
        {
          userId: dean._id,
          role: 'dean',
          userType: 'dean',
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      return res.json({ message: 'Login successful', token });
    }

    // 10) Student login (User collection)
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Email not registered' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Validate password first before sending OTP
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Send new OTP for verification
      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      await sendEmail(
        user.email,
        'Verify your email before login',
        `Your email is not verified. Please use OTP ${otp} to verify your account. It is valid for 10 minutes.`
      );

      return res.status(400).json({
        message: 'Please verify your email. A new OTP has been sent to your email.',
        requiresVerification: true,
        email: user.email,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        userType: 'user',
      },
      process.env.JWT_SECRET || 'default_secret',
      {
        expiresIn: '7d',
      }
    );

    return res.json({
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(
      user.email,
      'Your OTP for password reset',
      `Your password reset OTP is ${otp}. It is valid for 10 minutes.`
    );

    return res.json({ message: 'Password reset OTP sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error during forgot password' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'Invalid OTP request' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error during password reset' });
  }
};
