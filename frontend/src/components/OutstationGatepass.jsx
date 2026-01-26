import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/student-dashboard.css';
import PopupBox from './PopupBox';
import { createOutstationGatepass, getStudentStatus } from '../api/api';

// Professional SVG Icons
const Icons = {
  arrowLeft: <svg className="sa-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  plane: <svg className="sa-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>,
};

const OutstationGatepass = () => {
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
    roomNumber: '',
    course: '',
    department: '',
    branch: '',
    contact: '',
    leaveDays: '',
    dateOut: '',
    timeOut: '',
    dateIn: '',
    timeIn: '',
    address: '',
    natureOfLeave: '',
    reasonOfLeave: '',
    consent: false,
  });

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ open: false, message: '' });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [, setProfileLoading] = useState(true);
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getStudentStatus();
        const { studentName, rollnumber, department, branch, course, roomNumber, contactNumber } = res.data;
        setForm((prev) => ({
          ...prev,
          studentName: studentName || '',
          rollnumber: rollnumber || '',
          roomNumber: roomNumber || '',
          course: course || '',
          department: department || '',
          branch: branch || '',
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

  useEffect(() => {
    if (form.dateOut && form.dateIn) {
      const outDate = new Date(form.dateOut);
      const inDate = new Date(form.dateIn);
      const diffTime = inDate.getTime() - outDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setForm((prev) => ({ ...prev, leaveDays: diffDays }));
      } else {
        setForm((prev) => ({ ...prev, leaveDays: '' }));
      }
    } else {
      setForm((prev) => ({ ...prev, leaveDays: '' }));
    }
  }, [form.dateOut, form.dateIn]);

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
    if (loading) return;

    const {
      contact,
      dateOut, timeOut, dateIn, timeIn, consent,
    } = form;

    const requiredFields = [
      { key: 'studentName', label: 'Student Name' },
      { key: 'rollnumber', label: 'Roll Number' },
      { key: 'roomNumber', label: 'Room Number' },
      { key: 'course', label: 'Course' },
      { key: 'department', label: 'Department' },
      { key: 'contact', label: 'Contact Number' },
      { key: 'dateOut', label: 'Exit Date' },
      { key: 'timeOut', label: 'Exit Time' },
      { key: 'dateIn', label: 'Return Date' },
      { key: 'timeIn', label: 'Return Time' },
      { key: 'address', label: 'Address' },
      { key: 'natureOfLeave', label: 'Nature of Leave' },
      { key: 'reasonOfLeave', label: 'Reason for Leave' },
    ];

    const missingField = requiredFields.find(field => !form[field.key]);
    console.log('Form state:', form);
    console.log('Missing field:', missingField);
    if (missingField) {
      setPopup({ open: true, message: `Missing: ${missingField.label}` });
      return;
    }

    if (!/^\d{10}$/.test(contact)) {
      setPopup({ open: true, message: 'Contact number must be 10 digits.' });
      return;
    }

    if (!consent) {
      setPopup({ open: true, message: 'You must confirm that the information is correct.' });
      return;
    }

  const outDateTime = new Date(`${dateOut}T${timeOut}`);
  const inDateTime = new Date(`${dateIn}T${timeIn}`);
  const now = getIndiaNow();

    if (outDateTime <= now) {
      setPopup({ open: true, message: 'Out time must be in the future.' });
      return;
    }

    if (inDateTime <= outDateTime) {
      setPopup({ open: true, message: 'In time must be after out time.' });
      return;
    }

    setLoading(true);

    // Build FormData for file upload
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      formData.append(key, form[key]);
    });
    if (proofFile) {
      formData.append('proofFile', proofFile);
    }

    createOutstationGatepass(formData)
      .then(() => {
        setSubmitSuccess(true);
        setPopup({ open: true, message: 'Outstation gatepass applied successfully!' });
      })
      .catch((err) => {
        const message = err?.response?.data?.message || 'Failed to submit gatepass.';
        setPopup({ open: true, message });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="sd-shell">
      {/* Header */}
      <header className="sd-header">
        <div className="sd-header-brand">
          <span className="sd-logo">GoThru</span>
          <span className="sd-logo-sub">by Watchr</span>
        </div>
        <button className="sa-back-btn" onClick={() => navigate('/student/gatepass')}>
          {Icons.arrowLeft} Back
        </button>
      </header>

      <main className="sd-main lg-main">
        <h1 className="lg-title">Outstation Gatepass</h1>

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
                <span className="lg-info-label">Room No.</span>
                <span className="lg-info-value">{form.roomNumber || '—'}</span>
              </div>
              <div className="lg-info-item">
                <span className="lg-info-label">Contact</span>
                <span className="lg-info-value">{form.contact || '—'}</span>
              </div>
              {form.leaveDays > 0 && (
                <div className="lg-info-item">
                  <span className="lg-info-label">Leave Days</span>
                  <span className="lg-info-value">{form.leaveDays}</span>
                </div>
              )}
            </div>
          </div>

          {/* Course (from profile) */}
          <div className="lg-section">
            <div className="lg-section-label">COURSE</div>
            <div className="lg-info-item full">
              <span className="lg-info-label">Course</span>
              <span className="lg-info-value">{form.course || '—'}</span>
            </div>
          </div>

          {/* Travel Details Section */}
          <div className="lg-section">
            <div className="lg-section-label">TRAVEL DETAILS</div>

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
                <input className="lg-input" type="time" name="timeIn" value={form.timeIn} onChange={handleChange} />
              </div>
            </div>

            <div className="lg-field">
              <label className="lg-label">Address During Leave</label>
              <input className="lg-input" type="text" name="address" placeholder="Full address where you'll stay" value={form.address} onChange={handleChange} />
            </div>
          </div>

          {/* Leave Details Section */}
          <div className="lg-section">
            <div className="lg-section-label">LEAVE DETAILS</div>

            <div className="lg-field">
              <label className="lg-label">Nature of Leave</label>
              <input className="lg-input" type="text" name="natureOfLeave" placeholder="e.g., Personal, Medical, Family" value={form.natureOfLeave} onChange={handleChange} />
            </div>

            <div className="lg-field">
              <label className="lg-label">Reason for Leave</label>
              <input className="lg-input" type="text" name="reasonOfLeave" placeholder="Detailed reason" value={form.reasonOfLeave} onChange={handleChange} />
            </div>

            <div className="lg-field" style={{ marginBottom: 0 }}>
              <label className="lg-label">Upload Supporting File (Optional)</label>
              <input
                className="lg-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && file.size > 2 * 1024 * 1024) {
                    setPopup({ open: true, message: 'File size must be less than 2MB' });
                    e.target.value = '';
                    return;
                  }
                  setProofFile(file);
                }}
              />
              <span style={{ fontSize: '12px', color: '#888', marginTop: '4px', display: 'block' }}>
                PDF or Image (JPG, PNG) • Max 2MB
              </span>
            </div>
          </div>

          {/* Consent */}
          <label className="lg-consent">
            <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} />
            <span>I confirm that all information is correct. I understand that incorrect details may lead to denial of access.</span>
          </label>

          <button type="submit" className="lg-submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : <>{Icons.plane} Submit Application</>}
          </button>
        </form>
      </main>

      {/* Footer */}
      <div className="sd-footer">
        GoThru v1.1 • RGIPT Campus Access System
      </div>

      <PopupBox
        isOpen={popup.open}
        message={popup.message}
        onClose={() => {
          setPopup({ open: false, message: '' });
          if (submitSuccess) {
            navigate('/student');
          }
        }}
      />
    </div>
  );
};

export default OutstationGatepass;
