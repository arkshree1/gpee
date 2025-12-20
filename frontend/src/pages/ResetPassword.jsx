import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/api';
import '../styles/resetpassword.css';
import PopupBox from '../components/PopupBox';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const email = localStorage.getItem('resetEmail') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      navigate('/login');
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
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Reset Password</h2>

        <label>
          OTP
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </label>

        <label>
          New Password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </label>

        <label>
          Confirm New Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <PopupBox
        message={popupMessage}
        onClose={() => setPopupMessage('')}
      />
    </div>
  );
};

export default ResetPassword;
