import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/api';
import '../styles/gothru-auth.css';
import PopupBox from '../components/PopupBox';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      // Focus the next empty input or last input
      const nextIndex = Math.min(pastedData.length, 5);
      inputsRef.current[nextIndex]?.focus();
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
        <div className="gothru-auth-card">
          {/* Brand */}
          <div className="gothru-brand">
            <span className="gothru-brand-name">GoThru</span>
            <span className="gothru-brand-tagline">by Watchr</span>
          </div>

          {/* Title */}
          <h1 className="gothru-form-title">Reset Password</h1>

          {/* Subtitle */}
          <p className="gothru-form-subtitle">
            Enter the OTP sent to your email and create a new password
          </p>

          {/* Form */}
          <form className="gothru-form" onSubmit={handleSubmit}>
            {/* OTP Input */}
            <div className="gothru-input-group">
              <label className="gothru-label">6-digit OTP</label>
              <div className="gothru-otp-container" onPaste={handlePaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="gothru-otp-box"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    ref={(el) => (inputsRef.current[index] = el)}
                    required
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="newPassword">New Password</label>
              <div className="gothru-input-wrapper">
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="gothru-input gothru-input-password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  className="gothru-input gothru-input-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="gothru-btn">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          {/* Footer */}
          <div className="gothru-footer">
            <span
              className="gothru-footer-link"
              onClick={() => navigate('/login')}
            >
              Back to Login
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

export default ResetPassword;
