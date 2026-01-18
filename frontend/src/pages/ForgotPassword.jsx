import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api/api';
import '../styles/gothru-auth.css';
import PopupBox from '../components/PopupBox';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setPopupMessage('Email is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword({ email });
      setPopupMessage(response.data.message || 'OTP sent to your email.');
      localStorage.setItem('resetEmail', email);
      setTimeout(() => {
        navigate('/reset-password');
      }, 1500);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setPopupMessage(error.response.data.message);
      } else {
        setPopupMessage('Network or server error during forgot password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gothru-auth-page">
      <div className="gothru-auth-card">
        {/* Brand */}
        <div className="gothru-brand">
          <span className="gothru-brand-name">GoThru</span>
          <span className="gothru-brand-tagline">by Watchr</span>
        </div>

        {/* Title */}
        <h1 className="gothru-form-title">Forgot Password</h1>

        {/* Subtitle */}
        <p className="gothru-form-subtitle">
          Enter your registered email to receive an OTP
        </p>

        {/* Form */}
        <form className="gothru-form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="gothru-input-group">
            <label className="gothru-label" htmlFor="email">College Email</label>
            <div className="gothru-input-wrapper">
              <input
                id="email"
                type="email"
                className="gothru-input"
                placeholder="Enter your college email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className="gothru-input-icon">✉</span>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="gothru-btn">
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

        {/* Footer */}
        <div className="gothru-footer">
          Remember your password?{' '}
          <span
            className="gothru-footer-link"
            onClick={() => navigate('/login')}
          >
            Login
          </span>
        </div>
      </div>

      <PopupBox
        message={popupMessage}
        onClose={() => setPopupMessage('')}
      />
    </div>
  );
};

export default ForgotPassword;
