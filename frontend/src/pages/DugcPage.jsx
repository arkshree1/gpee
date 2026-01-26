import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getDugcProfile,
  getDugcPendingGatepasses,
  getDugcGatepassDetails,
  getDugcStudentOSHistory,
  getDugcGatepassHistory,
  decideDugcGatepass,
  sendDugcMeetingEmail,
} from '../api/api';
import PopupBox from '../components/PopupBox';
import ConfirmModal from '../components/ConfirmModal';
import StudentIdCardPopup from '../components/StudentIdCardPopup';
import '../styles/admin.css';

//hey
//hey



const DugcPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePage, setActivePage] = useState(() => searchParams.get('page') || 'requests');
  const [department, setDepartment] = useState('');

  // Fetch profile to get department
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getDugcProfile();
        setDepartment(res.data.department || '');
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);

  // Persist activePage to URL
  useEffect(() => {
    setSearchParams({ page: activePage }, { replace: true });
  }, [activePage, setSearchParams]);
  const [viewingGatepass, setViewingGatepass] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  //hey
  useEffect(() => {
    document.documentElement.classList.add('admin-page-active');
    document.body.classList.add('admin-page-active');
    return () => {
      document.documentElement.classList.remove('admin-page-active');
      document.body.classList.remove('admin-page-active');
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
//hey
  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setViewingGatepass(null);
    setSidebarOpen(false);
  };



  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-brand">
          <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="admin-header-logo-wrap">
            <span className="admin-header-logo">GoThru</span>
            <span className="admin-header-subtitle">by Watchr</span>
          </div>
        </div>
        <div className="admin-header-right">
          <span className="admin-header-role">{department} DUGC</span>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-body">
        <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <nav className="admin-sidebar-nav">
            <button
              className={`admin-nav-item ${activePage === 'requests' ? 'active' : ''}`}
              onClick={() => handleNavClick('requests')}
            >
              <svg className="admin-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="admin-nav-label">Current Requests</span>
            </button>
            <button
              className={`admin-nav-item ${activePage === 'history' ? 'active' : ''}`}
              onClick={() => handleNavClick('history')}
            >
              <svg className="admin-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="admin-nav-label">History</span>
            </button>
          </nav>
        </aside>

        <main className="admin-main">
          <div className="admin-college-banner">
            <h1 className="admin-college-name">RAJIV GANDHI INSTITUTE OF PETROLEUM TECHNOLOGY</h1>
            <p className="admin-college-subtitle">(An Institute of National Importance Established Under an Act of Parliament)</p>
            <h2 className="admin-college-name-hi">राजीव गाँधी पेट्रोलियम प्रौद्योगिकी संस्थान</h2>
            <p className="admin-college-subtitle-hi">(संसद के अधिनियम द्वारा राष्ट्रीय महत्व का संस्थान)</p>
          </div>

          <div className="os-content-area">
            {activePage === 'requests' && !viewingGatepass && (
              <RequestsView onViewDetails={setViewingGatepass} />
            )}
            {activePage === 'requests' && viewingGatepass && (
              <GatepassDetailsView gatepassId={viewingGatepass} onBack={() => setViewingGatepass(null)} />
            )}
            {activePage === 'history' && <HistoryView />}
          </div>
        </main>
      </div>
    </div>
  );
};

// ==================== REQUESTS VIEW ====================
const RequestsView = ({ onViewDetails }) => {
  const [gatepasses, setGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // ID Card popup state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showIdCard, setShowIdCard] = useState(false);

  const handleProfileClick = (student, gatepass) => {
    setSelectedStudent({
      ...student,
      name: gatepass.studentName,
      rollnumber: gatepass.rollnumber,
      branch: gatepass.branch || gatepass.department,
      department: gatepass.department,
      contact: gatepass.contact,
      roomNumber: gatepass.roomNumber,
      hostelName: gatepass.hostelName,
    });
    setShowIdCard(true);
  };

  const fetchGatepasses = async () => {
    try {
      setError('');
      const res = await getDugcPendingGatepasses();
      setGatepasses(res.data.gatepasses || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch gatepasses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatepasses();
    const interval = setInterval(fetchGatepasses, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year},  ${hours}:${mins} ${ampm}`;
  };

  const sortedGatepasses = [...gatepasses].sort((a, b) =>
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  return (
    <div className="os-section">
      <h2 className="os-section-title">Pending Outstation Gatepass Requests (DUGC)</h2>

      {loading && <div className="os-loading">Loading requests...</div>}
      {error && <div className="os-error">{error}</div>}

      {!loading && gatepasses.length === 0 && (
        <div className="os-empty">No pending outstation gatepass requests</div>
      )}

      <div className="os-cards-grid">
        {sortedGatepasses.map((gp) => (
          <div key={gp._id} className="os-request-card">
            <div 
              className="os-card-avatar profile-pic-hover"
              onClick={() => handleProfileClick(gp.student, gp)}
              title="Click to view GoThru ID Card"
            >
              {gp.student?.imageUrl ? (
                <img
                  src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${gp.student.imageUrl}`}
                  alt="Student"
                />
              ) : (
                <span style={{ fontSize: '20px', color: '#fff' }}>●</span>
              )}
            </div>
            <div className="os-card-info">
              <div className="os-card-name">{gp.studentName}</div>
              <div className="os-card-details">
                <span>{gp.course}</span>
                <span>{gp.rollnumber}</span>
              </div>
              <div className="os-card-branch">{gp.branch || gp.department}</div>
              <div className="os-card-applied">Applied: {formatDateTime(gp.createdAt)}</div>
            </div>
            <button className="os-view-btn" onClick={() => onViewDetails(gp._id)}>
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Student ID Card Popup */}
      <StudentIdCardPopup
        student={selectedStudent}
        isOpen={showIdCard}
        onClose={() => setShowIdCard(false)}
      />
    </div>
  );
};

// ==================== GATEPASS DETAILS VIEW ====================
const GatepassDetailsView = ({ gatepassId, onBack }) => {
  const [gatepass, setGatepass] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, decision: null });

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // DUGC Note for PhD students
  const [dugcNote, setDugcNote] = useState('');

  // Document popup state
  const [showDocPopup, setShowDocPopup] = useState(false);

  // Meeting email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDate, setEmailDate] = useState('');
  const [emailTime, setEmailTime] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // ID Card popup state
  const [showIdCard, setShowIdCard] = useState(false);

  // History gatepass popup state
  const [historyPopup, setHistoryPopup] = useState({ open: false, gatepass: null });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setError('');
        const gpRes = await getDugcGatepassDetails(gatepassId);
        setGatepass(gpRes.data.gatepass);

        if (gpRes.data.gatepass?.student?._id) {
          const historyRes = await getDugcStudentOSHistory(gpRes.data.gatepass.student._id);
          setStudentHistory(historyRes.data.gatepasses || []);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [gatepassId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatTime12hr = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year}, ${hours}:${mins} ${ampm}`;
  };

  const openConfirmModal = (decision) => {
    if (decision === 'rejected') {
      setShowRejectModal(true);
    } else {
      setConfirmModal({ open: true, decision });
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, decision: null });
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setPopupMessage('Please enter a reason for rejection');
      return;
    }
    setDeciding(true);
    try {
      const payload = { gatepassId, decision: 'rejected', rejectionReason };
      // Include DUGC note for PhD students
      if (gatepass?.course === 'PhD' && dugcNote.trim()) {
        payload.dugcNote = dugcNote;
      }
      const res = await decideDugcGatepass(payload);
      setShowRejectModal(false);
      setPopupMessage(res.data.message);
      setTimeout(() => onBack(), 1500);
    } catch (err) {
      setPopupMessage(err?.response?.data?.message || 'Failed to process decision');
    } finally {
      setDeciding(false);
    }
  };

  const handleDecision = async (decision) => {
    setDeciding(true);
    try {
      const payload = { gatepassId, decision };
      // Include DUGC note for PhD students
      if (gatepass?.course === 'PhD' && dugcNote.trim()) {
        payload.dugcNote = dugcNote;
      }
      const res = await decideDugcGatepass(payload);
      closeConfirmModal();
      setPopupMessage(res.data.message);
      setTimeout(() => onBack(), 1500);
    } catch (err) {
      setPopupMessage(err?.response?.data?.message || 'Failed to process decision');
      closeConfirmModal();
    } finally {
      setDeciding(false);
    }
  };

  // Format date for display (DD/MM/YYYY)
  const formatDateForEmail = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Format time for display (12hr)
  const formatTimeForEmail = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleSendEmail = async () => {
    if (!emailDate || !emailTime) {
      setPopupMessage('Please select both date and time for the meeting');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await sendDugcMeetingEmail({
        gatepassId,
        meetingDate: formatDateForEmail(emailDate),
        meetingTime: formatTimeForEmail(emailTime),
      });
      setShowEmailModal(false);
      setEmailDate('');
      setEmailTime('');
      setPopupMessage(res.data.message);
    } catch (err) {
      setPopupMessage(err?.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return <div className="os-loading">Loading details...</div>;
  if (error) return <div className="os-error">{error}</div>;
  if (!gatepass) return <div className="os-error">Gatepass not found</div>;

  return (
    <div className="os-details-view">
      <button className="os-back-btn" onClick={onBack}>
        ← Back to Requests
      </button>

      <h2 className="os-section-title">Gatepass Details</h2>

      <div className="os-details-card">
        {/* Student Profile Section */}
        <div className="os-student-profile-section">
          <div 
            className="os-student-photo-large profile-pic-hover"
            onClick={() => setShowIdCard(true)}
            title="Click to view GoThru ID Card"
          >
            {gatepass.student?.imageUrl ? (
              <img
                src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${gatepass.student.imageUrl}`}
                alt={gatepass.studentName}
              />
            ) : (
              <div className="os-photo-placeholder">👤</div>
            )}
          </div>
          <div className="os-student-basic-info">
            <h3 className="os-student-name">{gatepass.studentName}</h3>
            <p className="os-student-roll">{gatepass.rollnumber}</p>
            <p className="os-student-branch">{gatepass.branch || gatepass.department} • {gatepass.course}</p>
          </div>
        </div>

        <div className="os-details-grid">
          <div className="os-detail-item">
            <span className="os-detail-label">Room Number</span>
            <span className="os-detail-value">{gatepass.roomNumber}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Contact</span>
            <span className="os-detail-value">{gatepass.contact}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Leave Days</span>
            <span className="os-detail-value">{gatepass.leaveDays}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Exit</span>
            <span className="os-detail-value">{formatDate(gatepass.dateOut)} {formatTime12hr(gatepass.timeOut)}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Return</span>
            <span className="os-detail-value">{formatDate(gatepass.dateIn)} {formatTime12hr(gatepass.timeIn)}</span>
          </div>
        </div>

        <div className="os-detail-full">
          <span className="os-detail-label">Address During Leave</span>
          <span className="os-detail-value">{gatepass.address}</span>
        </div>
        <div className="os-detail-full">
          <span className="os-detail-label">Nature of Leave</span>
          <span className="os-detail-value">{gatepass.natureOfLeave}</span>
        </div>
        <div className="os-detail-full">
          <span className="os-detail-label">Reason for Leave</span>
          <span className="os-detail-value">{gatepass.reasonOfLeave}</span>
        </div>

        {/* Previous Leaves Taken (filled by Office Secretary) */}
        {gatepass.previousLeavesTaken && (
          <div className="os-detail-full os-previous-leaves-display" style={{ marginTop: '12px' }}>
            <span className="os-detail-label">Previous Leaves Taken (by Office Secretary)</span>
            <span className="os-detail-value">{gatepass.previousLeavesTaken}</span>
          </div>
        )}

        {/* Classes Missed (filled by Office Secretary) */}
        <div className="os-detail-full" style={{ marginTop: '12px' }}>
          <span className="os-detail-label">Classes Missed</span>
          <span className="os-detail-value">
            {gatepass.classesMissed === 'yes'
              ? `Yes (${gatepass.missedDays || 0} days)`
              : gatepass.classesMissed === 'no'
                ? 'No'
                : 'Not specified'}
          </span>
        </div>

        {/* PhD Leave Balance Display (from Office Secretary) */}
        {gatepass?.course === 'PhD' && gatepass.phdLeaveBalance && (
          <div className="os-phd-leave-display">
            <h4>📋 Leave Balance After Taking This Leave (from Office Secretary)</h4>
            <div className="os-phd-leave-display-grid">
              {gatepass.phdLeaveBalance.cl && (
                <div className="os-phd-leave-display-item">
                  <span className="os-phd-leave-display-label">CL (Casual Leave)</span>
                  <span className="os-phd-leave-display-value">{gatepass.phdLeaveBalance.cl}</span>
                </div>
              )}
              {gatepass.phdLeaveBalance.medical && (
                <div className="os-phd-leave-display-item">
                  <span className="os-phd-leave-display-label">Medical</span>
                  <span className="os-phd-leave-display-value">{gatepass.phdLeaveBalance.medical}</span>
                </div>
              )}
              {gatepass.phdLeaveBalance.otherType && (
                <div className="os-phd-leave-display-item">
                  <span className="os-phd-leave-display-label">{gatepass.phdLeaveBalance.otherType}</span>
                  <span className="os-phd-leave-display-value">{gatepass.phdLeaveBalance.other || '--'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DUGC Note Input (for PhD students only) */}
        {gatepass?.course === 'PhD' && (
          <div className="os-classes-section os-dugc-note-section">
            <h4>📝 Note for HOD (Optional)</h4>
            <p className="os-dugc-note-info">Add any notes or observations for the HOD regarding this PhD student's leave request.</p>
            <textarea
              className="os-dugc-note-input"
              placeholder="Enter your note for HOD (optional)..."
              value={dugcNote}
              onChange={(e) => setDugcNote(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Proof File Display - Opens in Popup */}
        {gatepass.proofFile && (
          <div className="os-detail-full" style={{ marginTop: '16px' }}>
            <span className="os-detail-label">Supporting Document</span>
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowDocPopup(true)}
                className="os-view-doc-btn"
              >
                {gatepass.proofFile.endsWith('.pdf') ? '📄 View PDF Document' : '🖼️ View Image Document'}
              </button>
            </div>
          </div>
        )}

        {/* Approval Timeline */}
        <div className="os-approval-timeline">
          <h4>Approval Timeline</h4>
          <div className="os-timeline-item">
            <span className="os-timeline-label">Student Applied</span>
            <span className="os-timeline-value">{formatDateTime(gatepass.createdAt)}</span>
          </div>
          {gatepass.stageStatus?.officeSecretary?.decidedAt && (
            <div className="os-timeline-item approved">
              <span className="os-timeline-label">Office Secretary Approved</span>
              <span className="os-timeline-value">{formatDateTime(gatepass.stageStatus.officeSecretary.decidedAt)}</span>
            </div>
          )}
        </div>

        {/* Email Student Section */}
        <div className="os-email-student-section">
          <p className="os-email-student-label">📧 Mail the student to meet you at your convenient time</p>
          <button
            className="os-email-student-btn"
            onClick={() => setShowEmailModal(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Send Meeting Email
          </button>
        </div>

        {/* Action Buttons */}
        <div className="os-action-btns">
          <button
            className="os-reject-btn"
            onClick={() => openConfirmModal('rejected')}
            disabled={deciding}
          >
            Reject
          </button>
          <button
            className="os-approve-btn"
            onClick={() => openConfirmModal('approved')}
            disabled={deciding}
          >
            Approve & Pass to HOD
          </button>
        </div>
      </div>

      <h3 className="os-history-title">Student's Previous Outstation Gatepasses</h3>
      <div className="os-history-list">
        {studentHistory.filter(h => h._id !== gatepassId).length === 0 && (
          <div className="os-empty">No previous outstation gatepasses</div>
        )}
        {studentHistory.filter(h => h._id !== gatepassId).map((h) => (
          <div key={h._id} className={`os-history-item ${h.finalStatus}`}>
            <div className="os-history-header">
              {h.gatePassNo && (
                <span 
                  className="os-history-gatepass-tag"
                  onClick={() => setHistoryPopup({ open: true, gatepass: h })}
                  title="Click to view details"
                >
                  {h.gatePassNo}
                </span>
              )}
              <span className="os-history-reason">{h.reasonOfLeave}</span>
              <span className={`os-status-badge ${h.finalStatus}`}>
                {h.finalStatus?.toUpperCase() || 'PENDING'}
              </span>
            </div>
            <div className="os-history-dates">
              Out: {formatDate(h.dateOut)} → In: {formatDate(h.dateIn)}
            </div>
          </div>
        ))}
      </div>

      {/* History Gatepass Details Popup */}
      {historyPopup.open && historyPopup.gatepass && (
        <div className="confirm-modal-overlay" onClick={() => setHistoryPopup({ open: false, gatepass: null })}>
          <div className="os-history-popup" onClick={(e) => e.stopPropagation()}>
            <button className="confirm-modal-close" onClick={() => setHistoryPopup({ open: false, gatepass: null })}>×</button>
            <div className="os-history-popup-header">
              <span className="os-history-popup-tag">{historyPopup.gatepass.gatePassNo}</span>
              <span className={`os-status-badge ${historyPopup.gatepass.finalStatus}`}>
                {historyPopup.gatepass.finalStatus?.toUpperCase() || 'PENDING'}
              </span>
            </div>
            <div className="os-history-popup-body">
              <div className="os-history-popup-row">
                <label>Reason of Leave:</label>
                <span>{historyPopup.gatepass.reasonOfLeave}</span>
              </div>
              <div className="os-history-popup-row">
                <label>Address:</label>
                <span>{historyPopup.gatepass.address || '--'}</span>
              </div>
              <div className="os-history-popup-row">
                <label>Date Out:</label>
                <span>{formatDate(historyPopup.gatepass.dateOut)}</span>
              </div>
              <div className="os-history-popup-row">
                <label>Date In:</label>
                <span>{formatDate(historyPopup.gatepass.dateIn)}</span>
              </div>
              {historyPopup.gatepass.classesMissed && (
                <div className="os-history-popup-row">
                  <label>Classes Missed:</label>
                  <span>{historyPopup.gatepass.classesMissed === 'yes' ? `Yes (${historyPopup.gatepass.missedDays || 0} days)` : 'No'}</span>
                </div>
              )}
              <div className="os-history-popup-row">
                <label>Applied On:</label>
                <span>{new Date(historyPopup.gatepass.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={closeConfirmModal}
        onConfirm={() => handleDecision(confirmModal.decision)}
        decision={confirmModal.decision}
        studentName={gatepass?.studentName}
        rollNumber={gatepass?.rollnumber}
        reasonOfLeave={gatepass?.reasonOfLeave}
        isProcessing={deciding}
      />

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="confirm-modal rejection-modal" onClick={(e) => e.stopPropagation()}>
            <button className="confirm-modal-close" onClick={() => setShowRejectModal(false)}>×</button>
            <div className="confirm-modal-header" style={{ borderLeftColor: '#e74c3c' }}>
              <h3>Reject Gatepass</h3>
            </div>
            <div className="confirm-modal-body">
              <p className="confirm-modal-question">
                Are you sure you want to <strong style={{ color: '#e74c3c' }}>reject</strong> this gatepass?
              </p>
              <div className="confirm-modal-details">
                <div className="confirm-modal-detail-row">
                  <span className="confirm-modal-label">Student:</span>
                  <span className="confirm-modal-value">{gatepass?.studentName} ({gatepass?.rollnumber})</span>
                </div>
              </div>
              <div className="rejection-reason-input">
                <label>Reason for Rejection <span style={{ color: '#e74c3c' }}>*</span></label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={4}
                />
              </div>
            </div>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={() => setShowRejectModal(false)} disabled={deciding}>
                Cancel
              </button>
              <button
                className="confirm-modal-confirm"
                style={{ backgroundColor: '#e74c3c' }}
                onClick={handleRejectConfirm}
                disabled={deciding || !rejectionReason.trim()}
              >
                {deciding ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Popup */}
      {showDocPopup && gatepass.proofFile && (
        <div className="confirm-modal-overlay doc-popup-overlay" onClick={() => setShowDocPopup(false)}>
          <div className="doc-popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="doc-popup-close" onClick={() => setShowDocPopup(false)}>×</button>
            {gatepass.proofFile.endsWith('.pdf') ? (
              <iframe
                src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${gatepass.proofFile}`}
                title="Supporting Document"
                className="doc-popup-iframe"
              />
            ) : (
              <img
                src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${gatepass.proofFile}`}
                alt="Supporting Document"
                className="doc-popup-image"
              />
            )}
          </div>
        </div>
      )}

      {/* Meeting Email Modal */}
      {showEmailModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="confirm-modal email-modal" onClick={(e) => e.stopPropagation()}>
            <button className="confirm-modal-close" onClick={() => setShowEmailModal(false)}>×</button>
            <div className="confirm-modal-header" style={{ borderLeftColor: '#3182ce' }}>
              <h3>📧 Send Meeting Invitation</h3>
            </div>
            <div className="confirm-modal-body">
              <p className="os-email-modal-info">
                Send an email to <strong>{gatepass?.studentName}</strong> inviting them to meet you at your convenient time.
              </p>
              <div className="os-email-form">
                <div className="os-email-form-row">
                  <label>
                    <span>Meeting Date <span style={{ color: '#e74c3c' }}>*</span></span>
                    <input
                      type="date"
                      value={emailDate}
                      onChange={(e) => setEmailDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </label>
                  <label>
                    <span>Meeting Time <span style={{ color: '#e74c3c' }}>*</span></span>
                    <input
                      type="time"
                      value={emailTime}
                      onChange={(e) => setEmailTime(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="confirm-modal-actions">
              <button className="confirm-modal-cancel" onClick={() => setShowEmailModal(false)} disabled={sendingEmail}>
                Cancel
              </button>
              <button
                className="confirm-modal-confirm os-email-send-btn"
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailDate || !emailTime}
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student ID Card Popup */}
      <StudentIdCardPopup
        student={gatepass ? {
          ...gatepass.student,
          name: gatepass.studentName,
          rollnumber: gatepass.rollnumber,
          branch: gatepass.branch || gatepass.department,
          department: gatepass.department,
          contact: gatepass.contact,
          roomNumber: gatepass.roomNumber,
          hostelName: gatepass.hostelName,
        } : null}
        isOpen={showIdCard}
        onClose={() => setShowIdCard(false)}
      />

      <PopupBox message={popupMessage} onClose={() => setPopupMessage('')} />
    </div>
  );
};

// ==================== HISTORY VIEW ====================
const HistoryView = () => {
  const [gatepasses, setGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);

  // ID Card popup state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showIdCard, setShowIdCard] = useState(false);

  const handleProfileClick = (e, student, gp) => {
    e.stopPropagation(); // Prevent row click
    setSelectedStudent({
      ...student,
      name: gp.studentName,
      rollnumber: gp.rollnumber,
      branch: gp.branch || gp.department,
      department: gp.department,
      contact: gp.contact,
      roomNumber: gp.roomNumber,
      hostelName: gp.hostelName,
    });
    setShowIdCard(true);
  };

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const fetchHistory = async (searchQuery = '') => {
    try {
      setError('');
      setLoading(true);
      const res = await getDugcGatepassHistory(searchQuery);
      setGatepasses(res.data.gatepasses || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory(search);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart}, ${timePart}`;
  };

  const handleRowClick = async (gp) => {
    if (!gp._id) return;

    setShowPopup(true);
    setPopupLoading(true);
    setPopupData(null);

    try {
      const res = await getDugcGatepassDetails(gp._id);
      const gatepass = res.data.gatepass;
      setPopupData({
        student: gatepass.student,
        gatePassNo: gatepass.gatePassNo,
        gatepassDetails: {
          natureOfLeave: gatepass.natureOfLeave,
          leaveDays: gatepass.leaveDays,
          reasonOfLeave: gatepass.reasonOfLeave,
          address: gatepass.address,
          status: gatepass.currentStage,
          finalStatus: gatepass.finalStatus,
          dateOut: gatepass.dateOut,
          dateIn: gatepass.dateIn,
          timeOut: gatepass.timeOut,
          timeIn: gatepass.timeIn,
          actualExitAt: gatepass.actualExitAt,
          actualEntryAt: gatepass.actualEntryAt,
          appliedAt: gatepass.createdAt,
          approvedAt: gatepass.stageStatus?.hostelOffice?.decidedAt,
        }
      });
    } catch (err) {
      setPopupData({ error: err.response?.data?.message || 'Failed to load gatepass details' });
    } finally {
      setPopupLoading(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupData(null);
  };

  return (
    <div className="os-section">
      <div className="os-history-header-row">
        <h2 className="os-section-title">Gatepass History (DUGC)</h2>
        <form onSubmit={handleSearch} className="os-search-form">
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="os-search-input"
          />
          <button type="submit" className="os-search-btn">🔍</button>
        </form>
      </div>

      {loading && <div className="os-loading">Loading history...</div>}
      {error && <div className="os-error">{error}</div>}

      {!loading && gatepasses.length === 0 && (
        <div className="os-empty">No history found</div>
      )}

      <div className="os-history-table">
        {gatepasses.map((gp) => {
          const hasGatepassNo = !!gp.gatePassNo;
          const isClickable = hasGatepassNo;
          const status = gp.stageStatus?.dugc?.status || 'pending';

          return (
            <div
              key={gp._id}
              className={`os-history-row-enhanced ${status} ${isClickable ? 'os-history-row-clickable' : ''}`}
              onClick={() => isClickable && handleRowClick(gp)}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
            >
              {/* Student Avatar */}
              <div 
                className="os-history-avatar profile-pic-hover"
                onClick={(e) => handleProfileClick(e, gp.student, gp)}
                title="Click to view GoThru ID Card"
              >
                {gp.student?.imageUrl ? (
                  <img src={`${API_BASE}${gp.student.imageUrl}`} alt="" />
                ) : (
                  <div className="os-history-avatar-placeholder">
                    {gp.studentName?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {/* Student Info */}
              <div className="os-history-student-info">
                <div className="os-history-name">{gp.studentName}</div>
                <div className="os-history-meta">{gp.rollnumber} • {gp.course} • {gp.department}</div>
              </div>

              {/* Gatepass Number */}
              {hasGatepassNo ? (
                <span className="os-history-gp-number">{gp.gatePassNo}</span>
              ) : status !== 'rejected' ? (
                <span className="os-history-gp-pending">Yet to be Approved</span>
              ) : null}

              {/* Leave Info */}
              <div className="os-history-leave-enhanced">
                <span>{formatDate(gp.dateOut)} - {formatDate(gp.dateIn)}</span>
                <span className="os-history-reason-text">{gp.reasonOfLeave}</span>
              </div>

              {/* Status Badge */}
              <div className={`os-status-badge ${status}`}>
                {status === 'approved' ? 'PASSED TO HOD' : 'REJECTED'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gatepass Detail Popup */}
      {showPopup && (
        <div className="gatepass-popup-overlay" onClick={closePopup}>
          <div className="gatepass-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="gatepass-popup-header">
              <h3>Gatepass Details</h3>
              <button className="gatepass-popup-close" onClick={closePopup}>×</button>
            </div>
            <div className="gatepass-popup-body">
              {popupLoading && <div className="os-loading">Loading gatepass details...</div>}
              {!popupLoading && popupData?.error && (
                <div className="os-error">{popupData.error}</div>
              )}
              {!popupLoading && popupData && !popupData.error && (
                <>
                  <div className="gatepass-popup-student">
                    <div 
                      className="gatepass-popup-avatar profile-pic-hover"
                      onClick={() => {
                        setSelectedStudent(popupData.student);
                        setShowIdCard(true);
                      }}
                      title="Click to view GoThru ID Card"
                    >
                      {popupData.student?.imageUrl ? (
                        <img src={`${API_BASE}${popupData.student.imageUrl}`} alt="" />
                      ) : (
                        <div className="gatepass-popup-avatar-placeholder">
                          {popupData.student?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="gatepass-popup-student-info">
                      <h4>{popupData.student?.name}</h4>
                      <p>{popupData.student?.rollnumber} • {popupData.student?.department}</p>
                    </div>
                  </div>

                  <div className="gatepass-popup-badges">
                    <span className="gatepass-popup-type-badge outstation">OUTSTATION</span>
                    <span className="gatepass-popup-number-badge">{popupData.gatePassNo}</span>
                    <span className={`gatepass-popup-status-badge ${popupData.gatepassDetails?.finalStatus || popupData.gatepassDetails?.status}`}>
                      {popupData.gatepassDetails?.finalStatus || popupData.gatepassDetails?.status || 'Pending'}
                    </span>
                  </div>

                  <div className="gatepass-popup-details">
                    <div className="gatepass-popup-detail-item">
                      <span className="gatepass-popup-detail-label">Nature of Leave</span>
                      <span className="gatepass-popup-detail-value">{popupData.gatepassDetails?.natureOfLeave || '--'}</span>
                    </div>
                    <div className="gatepass-popup-detail-item">
                      <span className="gatepass-popup-detail-label">Leave Days</span>
                      <span className="gatepass-popup-detail-value">{popupData.gatepassDetails?.leaveDays || '--'}</span>
                    </div>
                    <div className="gatepass-popup-detail-item full-width">
                      <span className="gatepass-popup-detail-label">Reason</span>
                      <span className="gatepass-popup-detail-value">{popupData.gatepassDetails?.reasonOfLeave || '--'}</span>
                    </div>
                    <div className="gatepass-popup-detail-item full-width">
                      <span className="gatepass-popup-detail-label">Address During Leave</span>
                      <span className="gatepass-popup-detail-value">{popupData.gatepassDetails?.address || '--'}</span>
                    </div>
                  </div>

                  <div className="gatepass-popup-utilization">
                    <h5>Scheduled Times</h5>
                    <div className="gatepass-popup-util-grid">
                      <div className="gatepass-popup-util-item exit">
                        <span className="gatepass-popup-util-label">Scheduled Exit</span>
                        <span className="gatepass-popup-util-value scheduled">
                          {popupData.gatepassDetails?.dateOut} {popupData.gatepassDetails?.timeOut || ''}
                        </span>
                      </div>
                      <div className="gatepass-popup-util-item entry">
                        <span className="gatepass-popup-util-label">Scheduled Entry</span>
                        <span className="gatepass-popup-util-value scheduled">
                          {popupData.gatepassDetails?.dateIn} {popupData.gatepassDetails?.timeIn || ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="gatepass-popup-utilization">
                    <h5>Actual Times</h5>
                    <div className="gatepass-popup-util-grid">
                      <div className="gatepass-popup-util-item exit">
                        <span className="gatepass-popup-util-label">Actual Exit</span>
                        <span className={`gatepass-popup-util-value ${!popupData.gatepassDetails?.actualExitAt ? 'not-done' : ''}`}>
                          {popupData.gatepassDetails?.actualExitAt ? formatDateTime(popupData.gatepassDetails.actualExitAt) : 'Not Done Yet'}
                        </span>
                      </div>
                      <div className="gatepass-popup-util-item entry">
                        <span className="gatepass-popup-util-label">Actual Entry</span>
                        <span className={`gatepass-popup-util-value ${!popupData.gatepassDetails?.actualEntryAt ? 'not-done' : ''}`}>
                          {popupData.gatepassDetails?.actualEntryAt ? formatDateTime(popupData.gatepassDetails.actualEntryAt) : 'Not Done Yet'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="gatepass-popup-timeline">
                    <h5>Approval Timeline</h5>
                    <div className="gatepass-popup-timeline-list">
                      <div className="gatepass-popup-timeline-item">
                        <span className="gatepass-popup-timeline-stage">Applied</span>
                        <span className="gatepass-popup-timeline-time">
                          {formatDateTime(popupData.gatepassDetails?.appliedAt) || '--'}
                        </span>
                      </div>
                      {popupData.gatepassDetails?.approvedAt && (
                        <div className="gatepass-popup-timeline-item approved">
                          <span className="gatepass-popup-timeline-stage">Final Approval</span>
                          <span className="gatepass-popup-timeline-time">
                            {formatDateTime(popupData.gatepassDetails.approvedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student ID Card Popup */}
      <StudentIdCardPopup
        student={selectedStudent}
        isOpen={showIdCard}
        onClose={() => setShowIdCard(false)}
      />
    </div>
  );
};

export default DugcPage;

