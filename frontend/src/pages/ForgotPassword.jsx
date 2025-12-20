import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api/api';
import '../styles/login.css';
import '../styles/forgotpassword.css';
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
    <div className="login-wrapper">
      <header className="login-header">
        <div className="login-header-text">
          <span className="login-brand">Passly</span>
          <span className="login-subbrand">by Watchr</span>
        </div>
      </header>

      <div className="banner">BANNER</div>

      <h3 className="login-title">FORGOT PASSWORD</h3>

      <form className="login-card" onSubmit={handleSubmit}>
        <p className="auth-subtitle">Enter your registered email to receive an OTP</p>

        <div className="input-group">
          <label className="input-label" htmlFor="email">College Email</label>
          <div className="input-shell">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="login-btn">
          {loading ? 'Sending OTP...' : 'SEND OTP'}
        </button>

        <p className="footer-text">
          Remember your password?{' '}
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

export default ForgotPassword;
