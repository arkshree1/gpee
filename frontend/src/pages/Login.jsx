import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';
import { getUserFromToken } from '../utils/auth';
import '../styles/login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formValues;

    if (!email || !password) {
      window.alert('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });
      window.alert(response.data.message || 'Login successful');

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      const user = getUserFromToken();

      if (user && user.role === 'student') {
        navigate('/student');
      } else if (user && user.role === 'gaurd') {
        navigate('/gaurd');
      } else if (user && user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/login');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        window.alert(error.response.data.message);
      } else {
        window.alert('Network or server error during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Student Login</h2>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formValues.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={formValues.password}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="auth-footer-text">
          Don&apos;t have an account?{' '}
          <span onClick={() => navigate('/signup')}>Register</span>
        </p>
        <p className="auth-footer-text">
          <span onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
        </p>
      </form>
    </div>
  );
};

export default Login;
