import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/student.css';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Otp from './pages/Otp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentPage from './pages/StudentPage';
import GuardPage from './pages/GuardPage';
import AdminPage from './pages/AdminPage';
import HodPage from './pages/HodPage';
import DugcPage from './pages/DugcPage';
import OfficeSecretaryPage from './pages/OfficeSecretaryPage';
import HostelOfficePage from './pages/HostelOfficePage';
import { getUserFromToken } from './utils/auth';

// Helper function to get home route based on user role
const getHomeRoute = (role) => {
  switch (role) {
    case 'student':
      return '/student';
    case 'guard':
      return '/guard';
    case 'admin':
      return '/admin';
    case 'hod':
      return '/hod';
    case 'dugc':
      return '/dugc';
    case 'officeSecretary':
      return '/office-secretary';
    case 'hostelOffice':
      return '/hostel-office';
    default:
      return '/login';
  }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = getUserFromToken();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If role not allowed, send user back to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Redirect authenticated users to their home screen
const AuthRoute = ({ children }) => {
  const user = getUserFromToken();

  if (user) {
    // User is already logged in, redirect to their home
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }

  return children;
};

// Root redirect component that checks auth status
const RootRedirect = () => {
  const user = getUserFromToken();
  if (user) {
    return <Navigate to={getHomeRoute(user.role)} replace />;
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
        <Route path="/reset-password" element={<AuthRoute><ResetPassword /></AuthRoute>} />
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guard/*"
          element={
            <ProtectedRoute allowedRoles={['guard']}>
              <GuardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/*"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <HodPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dugc/*"
          element={
            <ProtectedRoute allowedRoles={['dugc']}>
              <DugcPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/office-secretary/*"
          element={
            <ProtectedRoute allowedRoles={['officeSecretary']}>
              <OfficeSecretaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hostel-office/*"
          element={
            <ProtectedRoute allowedRoles={['hostelOffice']}>
              <HostelOfficePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
