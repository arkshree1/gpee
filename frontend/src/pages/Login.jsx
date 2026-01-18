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










import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';
import { getUserFromToken } from '../utils/auth';
import '../styles/gothru-auth.css';
import PopupBox from '../components/PopupBox';

const Login = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
                <span className="gothru-input-icon">✓</span>
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
    </div>
  );
};

export default Login;
