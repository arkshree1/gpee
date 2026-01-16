import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/student-dashboard.css';

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
          Back →
        </button>
      </header>

      <main className="sd-main gm-main">
        <h1 className="gm-title">Apply for Gatepass</h1>
        <p className="gm-subtitle">Select the type of gatepass you need</p>

        <div className="gm-options">
          {/* Local Gatepass Card */}
          <div className="gm-card" onClick={() => navigate('/student/gatepass/local')}>
            <div className="gm-card-icon">🏠</div>
            <div className="gm-card-content">
              <h3 className="gm-card-title">Local Gatepass</h3>
              <p className="gm-card-desc">For short trips within the city. Valid for same day return.</p>
            </div>
            <div className="gm-card-arrow">→</div>
          </div>

          {/* Outstation Gatepass Card */}
          <div className="gm-card" onClick={() => navigate('/student/gatepass/outstation')}>
            <div className="gm-card-icon">✈️</div>
            <div className="gm-card-content">
              <h3 className="gm-card-title">Outstation Gatepass</h3>
              <p className="gm-card-desc">For trips outside the city. Multi-day travel with parent approval.</p>
            </div>
            <div className="gm-card-arrow">→</div>
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
