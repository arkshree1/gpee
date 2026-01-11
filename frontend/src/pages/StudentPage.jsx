import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentHome from '../components/StudentHome';
import StudentApply from '../components/StudentApply';
import GatepassMenu from '../components/GatepassMenu';
import LocalGatepass from '../components/LocalGatepass';
import OutstationGatepass from '../components/OutstationGatepass';
import TrackGatepass from '../components/TrackGatepass';
import StudentProfile from '../components/StudentProfile';

const StudentPage = () => {
  return (
    <Routes>
      <Route index element={<StudentHome />} />
      <Route path="apply" element={<StudentApply />} />
      <Route path="gatepass" element={<GatepassMenu />} />
      <Route path="gatepass/local" element={<LocalGatepass />} />
      <Route path="gatepass/outstation" element={<OutstationGatepass />} />
      <Route path="track-gatepass" element={<TrackGatepass />} />
      <Route path="profile" element={<StudentProfile />} />
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Routes>
  );
};

export default StudentPage;

