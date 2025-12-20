import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyOtp } from '../api/api';
import '../styles/otp.css';
import PopupBox from '../components/PopupBox';

const Otp = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const email = localStorage.getItem('pendingEmail') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setPopupMessage('No email found for OTP verification. Please signup again.');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setPopupMessage('OTP must be 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOtp({ email, otp });
      setPopupMessage(response.data.message || 'OTP verified successfully.');
      localStorage.removeItem('pendingEmail');
      navigate('/login');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setPopupMessage(error.response.data.message);
      } else {
        setPopupMessage('Network or server error during OTP verification.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Verify OTP</h2>
        <p className="auth-subtitle">An OTP has been sent to your email.</p>

        <label>
          6-digit OTP
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      <PopupBox
        message={popupMessage}
        onClose={() => setPopupMessage('')}
      />
    </div>
  );
};

export default Otp;
