import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyOtp } from '../api/api';
import '../styles/login.css';
import '../styles/otp.css';
import PopupBox from '../components/PopupBox';

const Otp = () => {
  const navigate = useNavigate();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [popupMessage, setPopupMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  const email = localStorage.getItem('pendingEmail') || '';

  const handleChange = (index, value) => {
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
    <div className="login-wrapper">
      <header className="login-header">
        <div className="login-header-text">
          <span className="login-brand">GoThru</span>
          <span className="login-subbrand">by Watchr</span>
        </div>
      </header>

      <div className="banner">BANNER</div>

      <h3 className="login-title">ENTER OTP</h3>

      <form className="login-card" onSubmit={handleSubmit}>
        <p className="auth-subtitle">An OTP has been sent to your email.</p>

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
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (inputsRef.current[index] = el)}
                required
              />
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="login-btn">
          {loading ? 'Verifying...' : 'VERIFY OTP'}
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
