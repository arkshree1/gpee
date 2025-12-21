import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentHome from '../components/StudentHome';
import StudentApply from '../components/StudentApply';
import GatepassMenu from '../components/GatepassMenu';
import LocalGatepass from '../components/LocalGatepass';

const StudentPage = () => {
  return (
    <Routes>
      <Route index element={<StudentHome />} />
      <Route path="apply" element={<StudentApply />} />
      <Route path="gatepass" element={<GatepassMenu />} />
      <Route path="gatepass/local" element={<LocalGatepass />} />
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  );
};

export default StudentPage;
