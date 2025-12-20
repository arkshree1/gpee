import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentHome from '../components/StudentHome';
import StudentApply from '../components/StudentApply';

const StudentPage = () => {
  return (
    <Routes>
      <Route index element={<StudentHome />} />
      <Route path="apply" element={<StudentApply />} />
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  );
};

export default StudentPage;
