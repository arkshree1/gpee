import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/student.css';

const GatepassMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="student-shell">
      <header className="student-header">
        <div>
          <div className="brand">GoThru</div>
          <div className="sub">by Watchr</div>
        </div>
        <button className="student-back" type="button" onClick={() => navigate('/student')}>
          Back
        </button>
      </header>

      <main className="student-main">
        <button
          className="student-primary-btn"
          type="button"
          onClick={() => navigate('/student/gatepass/local')}
        >
          Apply for Local Gatepass
        </button>

        <button
          className="student-primary-btn"
          type="button"
          onClick={() => navigate('/student/gatepass/outstation')}
        >
          Apply for Outstation Gatepass
        </button>
      </main>
    </div>
  );
};

export default GatepassMenu;
