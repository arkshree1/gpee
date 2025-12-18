import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyOtp } from '../api/api';
import '../styles/otp.css';

const Otp = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const email = localStorage.getItem('pendingEmail') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      window.alert('No email found for OTP verification. Please signup again.');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      window.alert('OTP must be 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOtp({ email, otp });
      window.alert(response.data.message || 'OTP verified successfully.');
      localStorage.removeItem('pendingEmail');
      navigate('/login');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        window.alert(error.response.data.message);
      } else {
        window.alert('Network or server error during OTP verification.');
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
    </div>
  );
};

export default Otp;
