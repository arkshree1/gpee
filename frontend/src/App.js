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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
