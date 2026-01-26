import React from 'react';
import '../styles/student-id-card-popup.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const RGIPT_LOGO = '/rgipt-logo.png';

// Calculate batch from roll number (e.g., 23cd3037 → 2023-27)
const calculateBatch = (rollNumber) => {
  if (!rollNumber || rollNumber.length < 2) return '--';
  const prefix = rollNumber.substring(0, 2);
  const startYear = parseInt(prefix, 10);
  if (isNaN(startYear)) return '--';
  const fullStartYear = 2000 + startYear;
  const endYear = startYear + 4;
  return `${fullStartYear}-${endYear}`;
};

/**
 * StudentIdCardPopup - A popup component to display student GoThru ID card
 * 
 * @param {Object} props
 * @param {Object} props.student - Student data object with fields like name, rollnumber, imageUrl, etc.
 * @param {Function} props.onClose - Callback function when popup is closed
 * @param {boolean} props.isOpen - Whether the popup is visible
 */
const StudentIdCardPopup = ({ student, onClose, isOpen }) => {
  if (!isOpen || !student) return null;

  // Extract student data with fallbacks
  const studentName = student.name || student.studentName || '--';
  const rollNumber = (student.rollnumber || student.rollNumber || '--').toUpperCase();
  const course = student.course || 'B.Tech';
  const branch = student.branch || '--';
  const department = student.department || '--';
  const batch = calculateBatch(student.rollnumber || student.rollNumber);
  const roomNumber = student.roomNumber || '--';
  const hostelName = student.hostelName || '--';
  const contactNumber = student.contactNumber || student.contact || '--';
  const imageUrl = student.imageUrl ? `${API_BASE_URL}${student.imageUrl}` : null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="id-popup-overlay" onClick={handleOverlayClick}>
      <div className="id-popup-container">
        {/* Close Button */}
        <button className="id-popup-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* ID Card */}
        <div className="id-popup-card">
          {/* Header Section with College Name */}
          <div className="id-popup-header">
            {/* Left Side - Logo */}
            <div className="id-popup-logo-section">
              <img
                src={RGIPT_LOGO}
                alt="RGIPT Logo"
                className="id-popup-logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="id-popup-logo-text">GoThru x RGIPT</div>
            </div>

            {/* Right Side - College Name */}
            <div className="id-popup-college-info">
              <div className="id-popup-college-name-en">RAJIV GANDHI INSTITUTE OF PETROLEUM TECHNOLOGY</div>
              <div className="id-popup-college-subtitle">(An Institute of National Importance Established Under an Act of Parliament)</div>
              <div className="id-popup-college-name-hi">राजीव गाँधी पेट्रोलियम प्रौद्योगिकी संस्थान</div>
              <div className="id-popup-college-subtitle-hi">(संसद के अधिनियम द्वारा राष्ट्रीय महत्व का संस्थान)</div>
              <div className="id-popup-address">Mubarakpur Mukhetia More, Bahadurpur, Post: Harbanshganj, Jais, Amethi-229304, (U.P.) India</div>
            </div>
          </div>

          {/* Tricolor Line */}
          <div className="id-popup-tricolor">
            <div className="tricolor-saffron"></div>
            <div className="tricolor-white"></div>
            <div className="tricolor-green"></div>
          </div>

          {/* Card Title */}
          <div className="id-popup-title">Student GoThru Pass Card</div>

          {/* Main Content */}
          <div className="id-popup-body">
            {/* Photo Section */}
            <div className="id-popup-photo-section">
              <div className="id-popup-photo-frame">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="Student" 
                    className="id-popup-photo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="id-popup-photo-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="id-popup-details">
              <div className="id-popup-row">
                <span className="id-popup-label">Name</span>
                <span className="id-popup-colon">:</span>
                <span className="id-popup-value">{studentName}</span>
              </div>
              <div className="id-popup-row">
                <span className="id-popup-label">Room & Hostel</span>
                <span className="id-popup-colon">:</span>
                <span className="id-popup-value">{roomNumber}, {hostelName}</span>
              </div>
              <div className="id-popup-row">
                <span className="id-popup-label">Contact No.</span>
                <span className="id-popup-colon">:</span>
                <span className="id-popup-value">{contactNumber}</span>
              </div>
              <div className="id-popup-row">
                <span className="id-popup-label">Roll No.</span>
                <span className="id-popup-colon">:</span>
                <span className="id-popup-value">{rollNumber}</span>
              </div>
              <div className="id-popup-row">
                <span className="id-popup-label">Course</span>
                <span className="id-popup-colon">:</span>
                <span className="id-popup-value">{course}</span>
              </div>
              <div className="id-popup-row">
                <span className="id-popup-label">Branch</span>
                <span className="id-popup-colon">:</span>
                <span className="id-popup-value">{branch}</span>
              </div>
              <div className="id-popup-row">
                <span className="id-popup-label">Department</span>
                <span className="id-popup-colon">:</span>
                <span className="id-popup-value">{department}</span>
              </div>
              <div className="id-popup-row">
                <span className="id-popup-label">Batch</span>
                <span className="id-popup-colon">:</span>
                <span className="id-popup-value">{batch}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentIdCardPopup;
