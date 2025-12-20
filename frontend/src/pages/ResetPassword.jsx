import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/api';
import '../styles/login.css';
import '../styles/otp.css';
import '../styles/resetpassword.css';
import PopupBox from '../components/PopupBox';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const inputsRef = useRef([]);

  const email = localStorage.getItem('resetEmail') || '';

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const newDigits = [...otpDigits];
      newDigits[index - 1] = '';
      setOtpDigits(newDigits);
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');

    if (!email) {
      setPopupMessage('No email found for password reset. Please start again.');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setPopupMessage('OTP must be 6 digits.');
      return;
    }

    if (newPassword.length < 6) {
      setPopupMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPopupMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      setPopupMessage(response.data.message || 'Password reset successful.');
      localStorage.removeItem('resetEmail');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setPopupMessage(error.response.data.message);
      } else {
        setPopupMessage('Network or server error during password reset.');
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

      <h3 className="login-title">RESET PASSWORD</h3>

      <form className="login-card" onSubmit={handleSubmit}>
        <p className="auth-subtitle">Enter the OTP sent to your email and create a new password</p>

        <div className="input-group">
          <label className="input-label">6-digit OTP</label>
          <div className="otp-inputs">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-box"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (inputsRef.current[index] = el)}
                required
              />
            ))}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="newPassword">New Password</label>
          <div className="input-shell">
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
          <div className="input-shell">
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="login-btn">
          {loading ? 'Resetting...' : 'RESET PASSWORD'}
        </button>

        <p className="footer-text">
          <span className="reg-link" onClick={() => navigate('/login')}>Back to Login</span>
        </p>
      </form>

      <PopupBox
        message={popupMessage}
        onClose={() => setPopupMessage('')}
      />
    </div>
  );
};

export default ResetPassword;
