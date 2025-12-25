import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/gatepass.css';
import PopupBox from './PopupBox';
import { createOutstationGatepass } from '../api/api';

const OutstationGatepass = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    studentName: '',
    rollnumber: '',
    roomNumber: '',
    course: '',
    department: '',
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
        setPopup({ open: true, message: 'Outstation gatepass submitted successfully.' });
        setForm({
          studentName: '',
          rollnumber: '',
          roomNumber: '',
          course: '',
          department: '',
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
          <span className="gatepass-brand">Passly</span>
          <span className="gatepass-subbrand">by Watchr</span>
        </div>
      </header>

      <main className="gatepass-main">
        <h2 className="gatepass-title">OutStation Gate Pass</h2>

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
              <label className="gatepass-label">Room No.</label>
              <input
                className="gatepass-input"
                type="text"
                name="roomNumber"
                value={form.roomNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="gatepass-row">
            <div className="gatepass-field">
              <label className="gatepass-label">Course</label>
              <input
                className="gatepass-input"
                type="text"
                name="course"
                value={form.course}
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
              <label className="gatepass-label">Contact</label>
              <input
                className="gatepass-input"
                type="tel"
                name="contact"
                value={form.contact}
                onChange={handleChange}
              />
            </div>
            <div className="gatepass-field">
              <label className="gatepass-label">No. of leave days</label>
              <input
                className="gatepass-input"
                type="number"
                min="1"
                name="leaveDays"
                value={form.leaveDays}
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

          <div className="gatepass-row single">
            <label className="gatepass-label">No. of days classes missed</label>
            <input
              className="gatepass-input"
              type="number"
              min="0"
              name="missedDays"
              value={form.missedDays}
              onChange={handleChange}
            />
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
        onClose={() => setPopup({ open: false, message: '' })}
      />
    </div>
  );
};

export default OutstationGatepass;
