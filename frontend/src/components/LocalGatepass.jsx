import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLocalGatepass, getStudentStatus } from '../api/api';
import PopupBox from '../components/PopupBox';
import '../styles/student-dashboard.css';

// Professional SVG Icons
const Icons = {
  arrowLeft: <svg className="sa-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  file: <svg className="sa-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>,
};

const LocalGatepass = () => {
  const navigate = useNavigate();

  const getIndiaNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeInput = (date) => {
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const todayIndia = formatDateInput(getIndiaNow());
  const nowIndiaTime = formatTimeInput(getIndiaNow());

  const [form, setForm] = useState({
    studentName: '',
    rollnumber: '',
    department: '',
    course: '',
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
  const [, setProfileLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getStudentStatus();
        const { studentName, rollnumber, department, course, roomNumber, contactNumber } = res.data;
        setForm((prev) => ({
          ...prev,
          studentName: studentName || '',
          rollnumber: rollnumber || '',
          department: department || '',
          course: course || '',
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
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'dateOut') {
        if (value === todayIndia && next.timeOut && next.timeOut < nowIndiaTime) {
          next.timeOut = '';
        }
        if (next.dateIn && value && next.dateIn < value) {
          next.dateIn = '';
          next.timeIn = '';
        }
      }

      if (name === 'dateIn' && next.dateOut && value && value < next.dateOut) {
        next.dateIn = next.dateOut;
      }

      return next;
    });
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

  const outDateTime = new Date(`${dateOut}T${timeOut}`);
  const inDateTime = new Date(`${dateIn}T${timeIn}`);
  const now = getIndiaNow();

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
        setPopupMessage('Local gatepass applied successfully!');
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
    <div className="sd-shell">
      {/* Header */}
      <header className="sd-header">
        <div className="sd-header-brand">
          <span className="sd-logo">GoThru</span>
          <span className="sd-logo-sub">by Watchr</span>
        </div>
        <button
          className="sa-back-btn"
          onClick={() => navigate('/student/gatepass')}
        >
          {Icons.arrowLeft} Back
        </button>
      </header>

      <main className="sd-main lg-main">
        <h1 className="lg-title">Local Gatepass</h1>

        <form className="lg-form" onSubmit={handleSubmit}>
          {/* Student Info Section */}
          <div className="lg-section">
            <div className="lg-section-label">STUDENT INFORMATION</div>
            <div className="lg-info-grid">
              <div className="lg-info-item">
                <span className="lg-info-label">Name</span>
                <span className="lg-info-value">{form.studentName || '—'}</span>
              </div>
              <div className="lg-info-item">
                <span className="lg-info-label">Roll No.</span>
                <span className="lg-info-value">{form.rollnumber || '—'}</span>
              </div>
              <div className="lg-info-item">
                <span className="lg-info-label">Department</span>
                <span className="lg-info-value">{form.department || '—'}</span>
              </div>
              <div className="lg-info-item">
                <span className="lg-info-label">Course</span>
                <span className="lg-info-value">{form.course || '—'}</span>
              </div>
              <div className="lg-info-item">
                <span className="lg-info-label">Room No.</span>
                <span className="lg-info-value">{form.roomNumber || '—'}</span>
              </div>
            </div>
          </div>

          {/* Trip Details Section */}
          <div className="lg-section">
            <div className="lg-section-label">TRIP DETAILS</div>

            <div className="lg-field">
              <label className="lg-label">Semester</label>
              <input
                className="lg-input"
                type="text"
                name="semester"
                placeholder="e.g., 4th"
                value={form.semester}
                onChange={handleChange}
              />
            </div>

            <div className="lg-row">
              <div className="lg-field">
                <label className="lg-label">Exit Date</label>
                <input
                  className="lg-input"
                  type="date"
                  name="dateOut"
                  min={todayIndia}
                  value={form.dateOut}
                  onChange={handleChange}
                />
              </div>
              <div className="lg-field">
                <label className="lg-label">Exit Time</label>
                <input
                  className="lg-input"
                  type="time"
                  name="timeOut"
                  min={form.dateOut === todayIndia ? nowIndiaTime : undefined}
                  value={form.timeOut}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="lg-row">
              <div className="lg-field">
                <label className="lg-label">Return Date</label>
                <input
                  className="lg-input"
                  type="date"
                  name="dateIn"
                  min={form.dateOut || todayIndia}
                  value={form.dateIn}
                  onChange={handleChange}
                />
              </div>
              <div className="lg-field">
                <label className="lg-label">Return Time</label>
                <input
                  className="lg-input"
                  type="time"
                  name="timeIn"
                  value={form.timeIn}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="lg-field">
              <label className="lg-label">Purpose</label>
              <input
                className="lg-input"
                type="text"
                name="purpose"
                placeholder="e.g., Medical, Shopping, Family visit"
                value={form.purpose}
                onChange={handleChange}
              />
            </div>

            <div className="lg-field">
              <label className="lg-label">Place/Destination</label>
              <input
                className="lg-input"
                type="text"
                name="place"
                placeholder="e.g., City Market, Hospital"
                value={form.place}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Contact Section */}
          <div className="lg-section">
            <div className="lg-section-label">CONTACT</div>
            <div className="lg-info-item full">
              <span className="lg-info-label">Phone Number</span>
              <span className="lg-info-value">{form.contact || '—'}</span>
            </div>
          </div>

          {/* Consent */}
          <label className="lg-consent">
            <input
              type="checkbox"
              name="consent"
              checked={form.consent}
              onChange={handleChange}
            />
            <span>
              I confirm that all information is correct. I understand that incorrect details may lead to denial of access.
            </span>
          </label>

          <button type="submit" className="lg-submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : <>{Icons.file} Submit Application</>}
          </button>
        </form>

        <PopupBox message={popupMessage} onClose={() => {
          setPopupMessage('');
          if (submitSuccess) {
            navigate('/student');
          }
        }} />
      </main>

      {/* Footer */}
      <div className="sd-footer">
        GoThru v1.1 • RGIPT Campus Access System
      </div>
    </div>
  );
};

export default LocalGatepass;
