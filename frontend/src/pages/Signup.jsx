import React, { useState } from 'react';
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
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const validate = () => {
    const { name, rollnumber, email, password, confirmPassword } = formValues;

    if (!name || !rollnumber || !email || !password || !confirmPassword || !imageFile) {
      setPopupMessage('All fields including image are required.');
      return false;
    }

    if (!/^\d+$/.test(rollnumber)) {
      setPopupMessage('Roll number must be numeric.');
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
