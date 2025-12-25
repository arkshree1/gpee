import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLocalGatepass, getStudentStatus } from '../api/api';
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
    purpose: '',
    place: '',
    contact: '',
    consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch user profile data on mount to auto-fill the form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getStudentStatus();
        const { studentName, rollnumber, department, roomNumber, contactNumber } = res.data;
        setForm((prev) => ({
          ...prev,
          studentName: studentName || '',
          rollnumber: rollnumber || '',
          department: department || '',
          roomNumber: roomNumber || '',
          contact: contactNumber || '',
        }));
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
      purpose,
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
      !purpose ||
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

    // Validate out time is in the future
    const outDateTime = new Date(`${dateOut}T${timeOut}`);
    const inDateTime = new Date(`${dateIn}T${timeIn}`);
    const now = new Date();

    if (outDateTime <= now) {
      setPopupMessage('Out time must be in the future.');
      return;
    }

    if (inDateTime <= outDateTime) {
      setPopupMessage('In time must be after out time.');
      return;
    }

    setLoading(true);
    createLocalGatepass(form)
      .then((res) => {
        setPopupMessage('Local gatepass applied');
        setSubmitSuccess(true);
      })
      .catch((error) => {
        if (error.response && error.response.data && error.response.data.message) {
          setPopupMessage(error.response.data.message);
        } else {
          setPopupMessage('Network or server error while submitting gatepass.');
        }
        setSubmitSuccess(false);
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
              className="gatepass-input gatepass-input-readonly"
              type="text"
              name="studentName"
              value={form.studentName}
              readOnly
            />
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Roll No.</label>
              <input
                className="gatepass-input gatepass-input-readonly"
                type="text"
                name="rollnumber"
                value={form.rollnumber}
                readOnly
              />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">Department</label>
              <input
                className="gatepass-input gatepass-input-readonly"
                type="text"
                name="department"
                value={form.department}
                readOnly
              />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Room No.</label>
              <input
                className="gatepass-input gatepass-input-readonly"
                type="text"
                name="roomNumber"
                value={form.roomNumber}
                readOnly
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

          <div className="gatepass-row single">
            <label className="gatepass-label">Purpose</label>
            <input
              className="gatepass-input"
              type="text"
              name="purpose"
              placeholder="e.g., Medical checkup, Shopping, Family visit"
              value={form.purpose}
              onChange={handleChange}
            />
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
                className="gatepass-input gatepass-input-readonly"
                type="tel"
                name="contact"
                value={form.contact}
                readOnly
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
        <PopupBox message={popupMessage} onClose={() => {
          setPopupMessage('');
          if (submitSuccess) {
            navigate('/student');
          }
        }} />
      </main>
    </div>
  );
};

export default LocalGatepass;
