import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLocalGatepass } from '../api/api';
import PopupBox from '../components/PopupBox';
import '../styles/gatepass.css';

const LocalGatepass = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    studentName: '',
    rollnumber: '',
    department: '',
    roomNumber: '',
    semester: '',
    dateOut: '',
    timeOut: '',
    dateIn: '',
    timeIn: '',
    place: '',
    contact: '',
    consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const {
      studentName,
      rollnumber,
      department,
      roomNumber,
      semester,
      dateOut,
      timeOut,
      dateIn,
      timeIn,
      place,
      contact,
      consent,
    } = form;

    if (
      !studentName ||
      !rollnumber ||
      !department ||
      !roomNumber ||
      !semester ||
      !dateOut ||
      !timeOut ||
      !dateIn ||
      !timeIn ||
      !place ||
      !contact
    ) {
      setPopupMessage('All fields are required.');
      return;
    }

    if (!consent) {
      setPopupMessage('Please confirm that the information provided is correct.');
      return;
    }

    if (!/^\d{10}$/.test(contact)) {
      setPopupMessage('Contact number must be 10 digits.');
      return;
    }

    setLoading(true);
    createLocalGatepass(form)
      .then((res) => {
        setPopupMessage(res.data.message || 'Local gatepass submitted successfully.');
      })
      .catch((error) => {
        if (error.response && error.response.data && error.response.data.message) {
          setPopupMessage(error.response.data.message);
        } else {
          setPopupMessage('Network or server error while submitting gatepass.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
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
            <input
              className="gatepass-input"
              type="text"
              name="studentName"
              value={form.studentName}
              onChange={handleChange}
            />
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Roll No.</label>
              <input
                className="gatepass-input"
                type="text"
                name="rollnumber"
                value={form.rollnumber}
                onChange={handleChange}
              />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Department</label>
              <input
                className="gatepass-input"
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Room No.</label>
              <input
                className="gatepass-input"
                type="text"
                name="roomNumber"
                value={form.roomNumber}
                onChange={handleChange}
              />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Semester</label>
              <input
                className="gatepass-input"
                type="text"
                name="semester"
                value={form.semester}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Date (Out)</label>
              <input
                className="gatepass-input"
                type="date"
                name="dateOut"
                value={form.dateOut}
                onChange={handleChange}
              />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Time Out</label>
              <input
                className="gatepass-input"
                type="time"
                name="timeOut"
                value={form.timeOut}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Date (In)</label>
              <input
                className="gatepass-input"
                type="date"
                name="dateIn"
                value={form.dateIn}
                onChange={handleChange}
              />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Time In</label>
              <input
                className="gatepass-input"
                type="time"
                name="timeIn"
                value={form.timeIn}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Place</label>
              <input
                className="gatepass-input"
                type="text"
                name="place"
                value={form.place}
                onChange={handleChange}
              />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Contact</label>
              <input
                className="gatepass-input"
                type="tel"
                name="contact"
                value={form.contact}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="gatepass-consent">
            <label>
              <input
                type="checkbox"
                name="consent"
                checked={form.consent}
                onChange={handleChange}
              />
              <span>
                I confirm that all information provided is correct, and I understand that incorrect
                details may lead to denial of access or disciplinary action.
              </span>
            </label>
          </div>

          <button type="submit" className="gatepass-apply-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'APPLY'}
          </button>

          <button type="button" className="gatepass-back-link" onClick={() => navigate('/student/gatepass')}>
            Back
          </button>
        </form>
      <PopupBox message={popupMessage} onClose={() => setPopupMessage('')} />
      </main>
    </div>
  );
};

export default LocalGatepass;
