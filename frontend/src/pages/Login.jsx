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
import '../styles/login.css';
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
      // Optionally show success; for now keep subtle by not blocking navigation

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
    <div className="login-wrapper">
      <header className="login-header">
        <div className="login-header-text">
          <span className="login-brand">GoThru</span>
          <span className="login-subbrand">by Watchr</span>
        </div>
      </header>

      <div className="banner">BANNER</div>

      <h3 className="login-title">USER LOGIN</h3>

      <form className="login-card" onSubmit={handleSubmit}>

        <div className="input-group">
          <label className="input-label" htmlFor="email">College Email</label>
          <div className="input-shell">
            <input
              id="email"
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="password">Password</label>
          <div className="input-shell password-shell">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formValues.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="login-btn">
          {loading ? 'Logging in...' : 'LOGIN'}
        </button>

        <p className="footer-text">
          Don't Have an Account?{' '}
          <span className="reg-link" onClick={() => navigate('/signup')}>Register</span>
        </p>
      </form>

      <PopupBox
        message={popupMessage}
        onClose={() => setPopupMessage('')}
      />
    </div>
  );
};

export default Login;
