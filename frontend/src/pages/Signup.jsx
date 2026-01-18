import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api/api';
import '../styles/gothru-auth.css';
import PopupBox from '../components/PopupBox';

const Signup = () => {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    name: '',
    rollnumber: '',
    course: '',
    branch: '',
    hostelName: '',
    roomNumber: '',
    contactNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormValues((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const validate = () => {
    const { name, rollnumber, course, branch, hostelName, roomNumber, contactNumber, email, password, confirmPassword } = formValues;

    if (!name || !rollnumber || !course || !branch || !hostelName || !roomNumber || !contactNumber || !email || !password || !confirmPassword || !imageFile) {
      setPopupMessage('All fields including image are required.');
      return false;
    }

    if (!/^[A-Za-z0-9]+$/.test(rollnumber)) {
      setPopupMessage('Roll number must be alphanumeric (e.g. 23CD3037).');
      return false;
    }

    if (!/^\d{10}$/.test(contactNumber)) {
      setPopupMessage('Contact number must be 10 digits.');
      return false;
    }

    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      setPopupMessage('Please enter a valid email.');
      return false;
    }

    if (password.length < 6) {
      setPopupMessage('Password must be at least 6 characters.');
      return false;
    }

    if (password !== confirmPassword) {
      setPopupMessage('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', formValues.name);
      formData.append('rollnumber', formValues.rollnumber);
      formData.append('course', formValues.course);
      formData.append('branch', formValues.branch);
      formData.append('hostelName', formValues.hostelName);
      formData.append('roomNumber', formValues.roomNumber);
      formData.append('contactNumber', formValues.contactNumber);
      formData.append('email', formValues.email);
      formData.append('password', formValues.password);
      formData.append('confirmPassword', formValues.confirmPassword);
      formData.append('image', imageFile);

      const response = await signup(formData);
      setPopupMessage(response.data.message || 'Signup successful, please verify OTP.');

      if (response.data.email) {
        localStorage.setItem('pendingEmail', response.data.email);
      }

      navigate('/otp');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setPopupMessage(error.response.data.message);
      } else {
        setPopupMessage('Network or server error during signup.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gothru-auth-page">
      {/* Institutional Banner */}
      <div className="gothru-institution-banner">
        <img
          src="/rgipt-banner.png"
          alt="RGIPT - An Institution of National Importance, Government of India"
        />
      </div>

      {/* Auth Content */}
      <div className="gothru-auth-content">
        <div className="gothru-auth-card gothru-auth-card--signup">
          {/* Brand */}
          <div className="gothru-brand">
            <span className="gothru-brand-name">GoThru</span>
            <span className="gothru-brand-tagline">by Watchr</span>
          </div>

          {/* Title */}
          <h1 className="gothru-form-title">Sign Up</h1>

          {/* Form */}
          <form className="gothru-form" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="name">Full Name</label>
              <div className="gothru-input-wrapper">
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="gothru-input"
                  placeholder="Enter your name"
                  value={formValues.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Roll Number */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="rollnumber">Roll Number</label>
              <div className="gothru-input-wrapper">
                <input
                  id="rollnumber"
                  type="text"
                  name="rollnumber"
                  className="gothru-input"
                  placeholder="e.g. 23CD3037"
                  value={formValues.rollnumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Course */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="course">Course</label>
              <div className="gothru-input-wrapper">
                <select
                  id="course"
                  name="course"
                  className="gothru-select"
                  value={formValues.course}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select course</option>
                  <option value="BTech">BTech</option>
                  <option value="MBA">MBA</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
            </div>

            {/* Branch */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="branch">Branch</label>
              <div className="gothru-input-wrapper">
                <select
                  id="branch"
                  name="branch"
                  className="gothru-select"
                  value={formValues.branch}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select branch</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Chemical Engineering (Major: Renewable Energy Engineering)">
                    Chemical Engineering (Renewable Energy)
                  </option>
                  <option value="Chemical Engineering (Major: Petrochemicals and Polymers Engineering)">
                    Chemical Engineering (Petrochemicals)
                  </option>
                  <option value="Computer Science and Design Engineering">
                    Computer Science and Design
                  </option>
                  <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                  <option value="Electrical Engineering (Major: E Vehicle Technology)">
                    Electrical Engineering (EV Tech)
                  </option>
                  <option value="Electronics Engineering">Electronics Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mathematics and Computing">Mathematics and Computing</option>
                  <option value="Petroleum Engineering">Petroleum Engineering</option>
                  <option value="Petroleum Engineering (Major: Applied Petroleum Geoscience)">
                    Petroleum Engineering (Geoscience)
                  </option>
                </select>
              </div>
            </div>

            {/* Hostel */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="hostelName">Hostel</label>
              <div className="gothru-input-wrapper">
                <select
                  id="hostelName"
                  name="hostelName"
                  className="gothru-select"
                  value={formValues.hostelName}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select hostel</option>
                  <option value="sarojini">Sarojini</option>
                  <option value="aryabhatta">Aryabhatta</option>
                  <option value="thala">Thala</option>
                </select>
              </div>
            </div>

            {/* Room Number */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="roomNumber">Room Number</label>
              <div className="gothru-input-wrapper">
                <input
                  id="roomNumber"
                  type="text"
                  name="roomNumber"
                  className="gothru-input"
                  placeholder="e.g. E-501"
                  value={formValues.roomNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Contact */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="contactNumber">Contact Number</label>
              <div className="gothru-input-wrapper">
                <input
                  id="contactNumber"
                  type="tel"
                  name="contactNumber"
                  className="gothru-input"
                  placeholder="10-digit number"
                  value={formValues.contactNumber}
                  onChange={handleChange}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="email">College Email</label>
              <div className="gothru-input-wrapper">
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="gothru-input"
                  placeholder="Enter your college email"
                  value={formValues.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="password">Password</label>
              <div className="gothru-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="gothru-input gothru-input-password"
                  placeholder="Min 6 characters"
                  value={formValues.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="gothru-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '◡' : '◎'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="gothru-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="gothru-input gothru-input-password"
                  placeholder="Re-enter password"
                  value={formValues.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="gothru-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? '◡' : '◎'}
                </button>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="image">Profile Photo</label>
              <div className="gothru-input-wrapper">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="gothru-input"
                  onChange={handleImageChange}
                />
              </div>
              {imagePreview && (
                <div className="gothru-image-preview">
                  <img src={imagePreview} alt="Selected" />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="gothru-btn">
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
          </form>

          {/* Footer */}
          <div className="gothru-footer">
            Already a member?{' '}
            <span
              className="gothru-footer-link"
              onClick={() => navigate('/login')}
            >
              Sign In
            </span>
          </div>
        </div>
      </div>

      <PopupBox
        message={popupMessage}
        onClose={() => setPopupMessage('')}
      />
    </div>
  );
};

export default Signup;
