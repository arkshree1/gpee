import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/student-dashboard.css';

// Professional SVG Icons
const Icons = {
  home: <svg className="gm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  plane: <svg className="gm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>,
  arrowLeft: <svg className="gm-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  chevronRight: <svg className="gm-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
};

const GatepassMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="sd-shell">
      {/* Header */}
      <header className="sd-header">
        <div className="sd-header-brand">
          <span className="sd-logo">GoThru</span>
          <span className="sd-logo-sub">by Watchr</span>
        </div>
        <button
          className="sa-back-btn"
          onClick={() => navigate('/student')}
        >
          {Icons.arrowLeft} Back
        </button>
      </header>

      <main className="sd-main gm-main">
        <h1 className="gm-title">Apply for Gatepass</h1>
        <p className="gm-subtitle">Select the type of gatepass you need</p>

        <div className="gm-options">
          {/* Local Gatepass Card */}
          <div className="gm-card" onClick={() => navigate('/student/gatepass/local')}>
            <div className="gm-card-icon">{Icons.home}</div>
            <div className="gm-card-content">
              <h3 className="gm-card-title">Local Gatepass</h3>
              <p className="gm-card-desc">For short trips within the city. Valid for same day return.</p>
            </div>
            <div className="gm-card-arrow">{Icons.chevronRight}</div>
          </div>

          {/* Outstation Gatepass Card */}
          <div className="gm-card" onClick={() => navigate('/student/gatepass/outstation')}>
            <div className="gm-card-icon">{Icons.plane}</div>
            <div className="gm-card-content">
              <h3 className="gm-card-title">Outstation Gatepass</h3>
              <p className="gm-card-desc">For trips outside the city. Multi-day travel with parent approval.</p>
            </div>
            <div className="gm-card-arrow">{Icons.chevronRight}</div>
          </div>
        </div>

        <div className="gm-note">
          <strong>Note:</strong> All gatepasses require hostel office approval before they can be used for exit.
        </div>
      </main>

      {/* Footer */}
      <div className="sd-footer">
        GoThru v1.1 • RGIPT Campus Access System
      </div>
    </div>
  );
};

export default GatepassMenu;
