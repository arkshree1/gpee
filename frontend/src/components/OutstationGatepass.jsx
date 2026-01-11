import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/gatepass.css';
import PopupBox from './PopupBox';
import { createOutstationGatepass, getStudentStatus } from '../api/api';

const OutstationGatepass = () => {
  const navigate = useNavigate();

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
    classesMissed: '',
    missedDays: '',
    consent: false,
  });

  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ open: false, message: '' });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile data on mount to auto-fill the form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getStudentStatus();
        const { studentName, rollnumber, department, branch, roomNumber, contactNumber } = res.data;
        setForm((prev) => ({
          ...prev,
          studentName: studentName || '',
          rollnumber: rollnumber || '',
          roomNumber: roomNumber || '',
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

  // Auto-calculate leave days when dates change
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
      const newForm = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      // Reset missedDays to 0 when 'no' is selected
      if (name === 'classesMissed' && value === 'no') {
        newForm.missedDays = 0;
      }
      return newForm;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;

    const {
      studentName,
      rollnumber,
      roomNumber,
      course,
      department,
      contact,
      leaveDays,
      dateOut,
      timeOut,
      dateIn,
      timeIn,
      address,
      natureOfLeave,
      reasonOfLeave,
      classesMissed,
      missedDays,
      consent,
    } = form;

    if (
      !studentName ||
      !rollnumber ||
      !roomNumber ||
      !course ||
      !department ||
      !contact ||
      !leaveDays ||
      !dateOut ||
      !timeOut ||
      !dateIn ||
      !timeIn ||
      !address ||
      !natureOfLeave ||
      !reasonOfLeave ||
      !classesMissed ||
      missedDays === ''
    ) {
      setPopup({ open: true, message: 'Please fill in all fields.' });
      return;
    }

    if (!/^\d{10}$/.test(contact)) {
      setPopup({ open: true, message: 'Contact number must be 10 digits.' });
      return;
    }

    if (!consent) {
      setPopup({
        open: true,
        message:
          'You must confirm that the information is correct before applying for gatepass.',
      });
      return;
    }

    // Validate out time is in the future
    const outDateTime = new Date(`${dateOut}T${timeOut}`);
    const inDateTime = new Date(`${dateIn}T${timeIn}`);
    const now = new Date();

    if (outDateTime <= now) {
      setPopup({ open: true, message: 'Out time must be in the future.' });
      return;
    }

    if (inDateTime <= outDateTime) {
      setPopup({ open: true, message: 'In time must be after out time.' });
      return;
    }

    setLoading(true);

    createOutstationGatepass({
      ...form,
      leaveDays: Number(leaveDays),
      missedDays: Number(missedDays),
    })
      .then(() => {
        setSubmitSuccess(true);
        setPopup({
          open: true,
          message: 'Form submitted successfully! You can check the update in Track Gatepass page.'
        });
        setForm({
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
          classesMissed: '',
          missedDays: '',
          consent: false,
        });
      })
      .catch((err) => {
        const message = err?.response?.data?.message || 'Failed to submit gatepass. Please try again.';
        setPopup({ open: true, message });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="gatepass-wrapper">
      <header className="gatepass-header">
        <div className="gatepass-header-text">
          <span className="gatepass-brand">GoThru</span>
          <span className="gatepass-subbrand">by Watchr</span>
        </div>
      </header>

      <main className="gatepass-main">
        <h2 className="gatepass-title">OutStation Gate Pass</h2>

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
              <label className="gatepass-label">Room No.</label>
              <input
                className="gatepass-input gatepass-input-readonly"
                type="text"
                name="roomNumber"
                value={form.roomNumber}
                readOnly
              />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Course</label>
              <select
                className="gatepass-input"
                name="course"
                value={form.course}
                onChange={handleChange}
              >
                <option value="">Select Course</option>
                <option value="BTech">BTech</option>
                <option value="MBA">MBA</option>
                <option value="PhD">PhD</option>
              </select>
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
              <label className="gatepass-label">Contact</label>
              <input
                className="gatepass-input gatepass-input-readonly"
                type="tel"
                name="contact"
                value={form.contact}
                readOnly
              />
            </div>
            {form.dateOut && form.dateIn && form.leaveDays > 0 && (
              <div className="gatepass-field">
                <label className="gatepass-label">No. of leave days</label>
                <input
                  className="gatepass-input gatepass-input-readonly"
                  type="number"
                  name="leaveDays"
                  value={form.leaveDays}
                  readOnly
                />
              </div>
            )}
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
            <label className="gatepass-label">Address During Leave</label>
            <input
              className="gatepass-input"
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="gatepass-row single">
            <label className="gatepass-label">Nature Of Leave</label>
            <input
              className="gatepass-input"
              type="text"
              name="natureOfLeave"
              value={form.natureOfLeave}
              onChange={handleChange}
            />
          </div>

          <div className="gatepass-row single">
            <label className="gatepass-label">Reason Of Leave</label>
            <input
              className="gatepass-input"
              type="text"
              name="reasonOfLeave"
              value={form.reasonOfLeave}
              onChange={handleChange}
            />
          </div>

          <div className="gatepass-row single">
            <label className="gatepass-label">Will classes be missed?</label>
            <div className="gatepass-radio-group">
              <label>
                <input
                  type="radio"
                  name="classesMissed"
                  value="yes"
                  checked={form.classesMissed === 'yes'}
                  onChange={handleChange}
                />{' '}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="classesMissed"
                  value="no"
                  checked={form.classesMissed === 'no'}
                  onChange={handleChange}
                />{' '}
                No
              </label>
            </div>
          </div>

          {form.classesMissed === 'yes' && (
            <div className="gatepass-row single">
              <label className="gatepass-label">No. of days classes missed</label>
              <input
                className="gatepass-input"
                type="number"
                min="1"
                name="missedDays"
                value={form.missedDays}
                onChange={handleChange}
              />
            </div>
          )}

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

          <button type="submit" className="gatepass-apply-btn">
            {loading ? 'APPLYING...' : 'APPLY'}
          </button>

          <button
            type="button"
            className="gatepass-back-link"
            onClick={() => navigate('/student/gatepass')}
          >
            Back
          </button>
        </form>
      </main>

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
