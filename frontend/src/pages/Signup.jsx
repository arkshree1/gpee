import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api/api';
import '../styles/login.css';
import '../styles/signup.css';
import PopupBox from '../components/PopupBox';

const Signup = () => {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    name: '',
    rollnumber: '',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') {
      // Allow only digits and cap at 10 characters
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
    const { name, rollnumber, branch, hostelName, roomNumber, contactNumber, email, password, confirmPassword } = formValues;

    if (!name || !rollnumber || !branch || !hostelName || !roomNumber || !contactNumber || !email || !password || !confirmPassword || !imageFile) {
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
    <div className="login-wrapper">
      <header className="login-header">
        <div className="login-header-text">
          <span className="login-brand">Passly</span>
          <span className="login-subbrand">by Watchr</span>
        </div>
      </header>

      <div className="banner">BANNER</div>

      <h3 className="login-title">STUDENT SIGNUP</h3>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label" htmlFor="name">Name</label>
          <div className="input-shell">
            <input
              id="name"
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="rollnumber">Roll Number</label>
          <div className="input-shell">
            <input
              id="rollnumber"
              type="text"
              name="rollnumber"
              value={formValues.rollnumber}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="branch">Branch</label>
          <div className="input-shell">
            <select
              id="branch"
              name="branch"
              value={formValues.branch}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select branch</option>
              <option value="chemical">Chemical</option>
              <option value="cse">CSE</option>
              <option value="csd">CSD</option>
              <option value="petro">Petro</option>
              <option value="electrical">Electrical</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="hostelName">Hostel</label>
          <div className="input-shell">
            <select
              id="hostelName"
              name="hostelName"
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

        <div className="input-group">
          <label className="input-label" htmlFor="roomNumber">Room No.</label>
          <div className="input-shell">
            <input
              id="roomNumber"
              type="text"
              name="roomNumber"
              placeholder="E-501"
              value={formValues.roomNumber}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="contactNumber">Contact</label>
          <div className="input-shell">
            <input
              id="contactNumber"
              type="tel"
              name="contactNumber"
              placeholder="10-digit number"
              value={formValues.contactNumber}
              onChange={handleChange}
              maxLength={10}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="email">College Email</label>
          <div className="input-shell">
            <input
              id="email"
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="password">Password</label>
          <div className="input-shell">
            <input
              id="password"
              type="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="confirmPassword">Confirm</label>
          <div className="input-shell">
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formValues.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="image">Photo</label>
          <div className="input-shell">
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Selected" />
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="login-btn">
          {loading ? 'Registering...' : 'REGISTER'}
        </button>

        <p className="footer-text">
          Already have an account?{' '}
          <span className="reg-link" onClick={() => navigate('/login')}>Login</span>
        </p>
      </form>

      <PopupBox
        message={popupMessage}
        onClose={() => setPopupMessage('')}
      />
    </div>
  );
};

export default Signup;
