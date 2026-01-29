import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyOtp } from '../api/api';
import '../styles/gothru-auth.css';
import PopupBox from '../components/PopupBox';

const Otp = () => {
  const navigate = useNavigate();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [popupMessage, setPopupMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
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

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pastedData.length, 5);
      inputsRef.current[nextIndex]?.focus();
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
      setPopupMessage(response.data.message || 'OTP verified. You can now login.');
      setOtpVerified(true);
      localStorage.removeItem('pendingEmail');
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

  useEffect(() => {
    if (!otpVerified) return undefined;
    const timer = setTimeout(() => {
      navigate('/login');
    }, 1500);
    return () => clearTimeout(timer);
  }, [otpVerified, navigate]);

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
          <h1 className="gothru-form-title">Enter OTP</h1>

          {/* Subtitle */}
          <p className="gothru-form-subtitle">
            An OTP has been sent to your email
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
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    ref={(el) => (inputsRef.current[index] = el)}
                    required
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="gothru-btn">
              {loading ? 'Verifying...' : 'Verify OTP'}
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
        onClose={() => {
          setPopupMessage('');
          if (otpVerified) {
            navigate('/login');
          }
        }}
      />
    </div>
  );
};

export default Otp;
