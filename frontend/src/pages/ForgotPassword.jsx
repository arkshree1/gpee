import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api/api';
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
      navigate('/reset-password');
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
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>

        <label>
          Enter your registered email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>

      <PopupBox
        message={popupMessage}
        onClose={() => setPopupMessage('')}
      />
    </div>
  );
};

export default ForgotPassword;
