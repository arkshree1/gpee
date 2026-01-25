// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { login } from '../api/api';
// import { getUserFromToken } from '../utils/auth';
// import '../styles/login.css';

// const Login = () => {
//   const navigate = useNavigate();
//   const [formValues, setFormValues] = useState({
//     email: '',
//     password: '',
//   });
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormValues((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const { email, password } = formValues;

//     if (!email || !password) {
//       window.alert('Email and password are required.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await login({ email, password });
//       window.alert(response.data.message || 'Login successful');

//       if (response.data.token) {
//         localStorage.setItem('token', response.data.token);
//       }

//       const user = getUserFromToken();

//       if (user && user.role === 'student') {
//         navigate('/student');
//       } else if (user && (user.role === 'guard' || user.role === 'gaurd')) {
//         navigate('/guard');
//       } else if (user && user.role === 'admin') {
//         navigate('/admin');
//       } else {
//         navigate('/login');
//       }
//     } catch (error) {
//       if (error.response && error.response.data && error.response.data.message) {
//         window.alert(error.response.data.message);
//       } else {
//         window.alert('Network or server error during login.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <form className="auth-form" onSubmit={handleSubmit}>
//   <h2>Campus Access Login</h2>

//         <label>
//           Email
//           <input
//             type="email"
//             name="email"
//             value={formValues.email}
//             onChange={handleChange}
//             required
//           />
//         </label>

//         <label>
//           Password
//           <input
//             type="password"
//             name="password"
//             value={formValues.password}
//             onChange={handleChange}
//             required
//           />
//         </label>

//         <button type="submit" disabled={loading}>
//           {loading ? 'Logging in...' : 'Login'}
//         </button>

//         <p className="auth-footer-text">
//           Students new here?{' '}
//           <span onClick={() => navigate('/signup')}>Register</span>
//         </p>
//         <p className="auth-footer-text">
//           <span onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
//         </p>
//       </form>
//     </div>
//   );
// };

// export default Login;








//hey

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';
import { getUserFromToken } from '../utils/auth';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import '../styles/gothru-auth.css';
import PopupBox from '../components/PopupBox';

// Dynamic words for type-erase animation (no commas)
const DYNAMIC_WORDS = ['smoothly', 'effortlessly', 'paperlessly', 'securely', 'quickly'];

// Animation timing (premium, human feel)
const TYPING_SPEED = 70;      // ms per character
const ERASING_SPEED = 50;     // ms per character
const PAUSE_AFTER_WORD = 800; // ms after word completes
const PAUSE_BEFORE_NEXT = 300; // ms before next word

const Login = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Type-erase animation state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Type-erase animation effect
  useEffect(() => {
    const currentWord = DYNAMIC_WORDS[currentWordIndex];
    let timeout;

    if (isTyping) {
      // Typing phase
      if (displayText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, TYPING_SPEED);
      } else {
        // Word complete, pause then start erasing
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, PAUSE_AFTER_WORD);
      }
    } else {
      // Erasing phase
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, ERASING_SPEED);
      } else {
        // Word erased, pause then move to next word
        timeout = setTimeout(() => {
          setCurrentWordIndex((prev) => (prev + 1) % DYNAMIC_WORDS.length);
          setIsTyping(true);
        }, PAUSE_BEFORE_NEXT);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isTyping, currentWordIndex]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formValues;

    if (!email || !password) {
      setPopupMessage('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      const user = getUserFromToken();

      if (user && user.role === 'student') {
        navigate('/student');
      } else if (user && (user.role === 'guard' || user.role === 'gaurd')) {
        navigate('/guard');
      } else if (user && user.role === 'admin') {
        navigate('/admin');
      } else if (user && user.role === 'officeSecretary') {
        navigate('/office-secretary');
      } else if (user && user.role === 'hod') {
        navigate('/hod');
      } else if (user && user.role === 'dugc') {
        navigate('/dugc');
      } else if (user && user.role === 'hostelOffice') {
        navigate('/hostel-office');
      } else {
        navigate('/login');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setPopupMessage(error.response.data.message);
      } else {
        setPopupMessage('Network or server error during login.');
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

      {/* Feature Section */}
      <div className="gothru-feature-section">
        {/* Animation Area - Left Column */}
        <div className="gothru-animation-area">
          <DotLottieReact
            src="https://lottie.host/f1cc3b6d-06d3-41e5-b3b6-ca2d6f451802/wmIRwh83W1.lottie"
            loop
            autoplay
            style={{ width: '100%', height: '100%', transform: 'scale(1.25)' }}
          />
        </div>

        {/* Headline Area - Right Column */}
        <div className="gothru-headline-area">
          <span className="gothru-headline-line poppins-semibold">People Move</span>
          <span className="gothru-headline-line poppins-semibold">In and Out</span>
          <span className="gothru-headline-dynamic poppins-semibold">{displayText}</span>
          <span className="gothru-headline-tagline poppins-medium">GoThru handles it!</span>
        </div>
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
          <h1 className="gothru-form-title">Login</h1>

          {/* Form */}
          <form className="gothru-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="email">Email</label>
              <div className="gothru-input-wrapper">
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="gothru-input"
                  placeholder="Enter your email"
                  value={formValues.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="gothru-input-group">
              <label className="gothru-label" htmlFor="password">Password</label>
              <div className="gothru-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="gothru-input gothru-input-password"
                  placeholder="Enter your password"
                  value={formValues.password}
                  onChange={handleChange}
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

            {/* Forgot Password */}
            <span
              className="gothru-link gothru-forgot-link"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot Password?
            </span>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="gothru-btn">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Footer */}
          <div className="gothru-footer">
            I'm a new user?{' '}
            <span
              className="gothru-footer-link"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </span>
          </div>
        </div>
      </div>

      <PopupBox
        message={popupMessage}
        onClose={() => setPopupMessage('')}
      />

      {/* Version Footer */}
      <div className="gothru-version-footer">
        Version 1.1 | GoThru by Watchr
      </div>
    </div>
  );
};

export default Login;
