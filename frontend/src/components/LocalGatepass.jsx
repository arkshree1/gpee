import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/gatepass.css';

const LocalGatepass = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire to backend
  };

  return (
    <div className="gatepass-wrapper">
      <header className="gatepass-header">
        <div className="gatepass-header-text">
          <span className="gatepass-brand">Passly</span>
          <span className="gatepass-subbrand">by Watchr</span>
        </div>
      </header>

      <main className="gatepass-main">
        <h2 className="gatepass-title">Local Gate Pass</h2>

        <form className="gatepass-card" onSubmit={handleSubmit}>
          <div className="gatepass-row single">
            <label className="gatepass-label">Student's Name</label>
            <input className="gatepass-input" type="text" name="name" />
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Roll No.</label>
              <input className="gatepass-input" type="text" name="roll" />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Department</label>
              <input className="gatepass-input" type="text" name="department" />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Room No.</label>
              <input className="gatepass-input" type="text" name="room" />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Semester</label>
              <input className="gatepass-input" type="text" name="semester" />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Date (Out)</label>
              <input className="gatepass-input" type="date" name="dateOut" />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Time Out</label>
              <input className="gatepass-input" type="time" name="timeOut" />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Date (In)</label>
              <input className="gatepass-input" type="date" name="dateIn" />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Time In</label>
              <input className="gatepass-input" type="time" name="timeIn" />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Place</label>
              <input className="gatepass-input" type="text" name="place" />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Contact</label>
              <input className="gatepass-input" type="tel" name="contact" />
            </div>
          </div>

          <div className="gatepass-consent">
            <label>
              <input type="checkbox" />
              <span>
                I confirm that all information provided is correct, and I understand that incorrect
                details may lead to denial of access or disciplinary action.
              </span>
            </label>
          </div>

          <button type="submit" className="gatepass-apply-btn">
            APPLY
          </button>

          <button type="button" className="gatepass-back-link" onClick={() => navigate('/student/gatepass')}>
            Back
          </button>
        </form>
      </main>
    </div>
  );
};

export default LocalGatepass;
