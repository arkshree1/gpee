import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getSecretaryPendingGatepasses,
  getSecretaryGatepassDetails,
  getStudentOSHistory,
  getSecretaryGatepassHistory,
  decideOutstationGatepass,
} from '../api/api';
import PopupBox from '../components/PopupBox';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/admin.css';

const OfficeSecretaryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePage, setActivePage] = useState(() => searchParams.get('page') || 'requests');

  // Persist activePage to URL
  useEffect(() => {
    setSearchParams({ page: activePage }, { replace: true });
  }, [activePage, setSearchParams]);
  const [viewingGatepass, setViewingGatepass] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent page scrolling
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

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setViewingGatepass(null);
    setSidebarOpen(false);
  };

  const navItems = [
    { id: 'requests', icon: '☐', label: 'Current Requests' },
    { id: 'history', icon: '↺', label: 'History' },
  ];

  return (
    <div className="admin-layout">
      {/* Header */}
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
          <span className="admin-header-role">CSE Office Secretary</span>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Body */}
      <div className="admin-body">
        {/* Sidebar */}
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

        {/* Main Content */}
        <main className="admin-main">
          {/* College Banner */}
          <div className="admin-college-banner">
            <h1 className="admin-college-name">RAJIV GANDHI INSTITUTE OF PETROLEUM TECHNOLOGY</h1>
            <p className="admin-college-subtitle">(An Institute of National Importance Established Under an Act of Parliament)</p>
            <h2 className="admin-college-name-hi">राजीव गाँधी पेट्रोलियम प्रौद्योगिकी संस्थान</h2>
            <p className="admin-college-subtitle-hi">(संसद के अधिनियम द्वारा राष्ट्रीय महत्व का संस्थान)</p>
          </div>

          {/* Content Area */}
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

  const fetchGatepasses = async () => {
    try {
      setError('');
      const res = await getSecretaryPendingGatepasses();
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

  // Format date/time for display
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
    return `${day}/${month}/${year} ${hours}:${mins} ${ampm}`;
  };

  // Sort gatepasses - oldest first (ascending by createdAt)
  const sortedGatepasses = [...gatepasses].sort((a, b) =>
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  return (
    <div className="os-section">
      <h2 className="os-section-title">Pending Outstation Gatepass Requests</h2>

      {loading && <div className="os-loading">Loading requests...</div>}
      {error && <div className="os-error">{error}</div>}

      {!loading && gatepasses.length === 0 && (
        <div className="os-empty">No pending outstation gatepass requests</div>
      )}

      <div className="os-cards-grid">
        {sortedGatepasses.map((gp) => (
          <div key={gp._id} className="os-request-card">
            <div className="os-card-avatar">
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

  // Classes missed input (filled by secretary)
  const [classesMissed, setClassesMissed] = useState('no');
  const [missedDays, setMissedDays] = useState(0);
  
  // Previous leaves taken input (filled by secretary)
  const [previousLeavesTaken, setPreviousLeavesTaken] = useState('');
  
  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Document popup state
  const [showDocPopup, setShowDocPopup] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setError('');
        const gpRes = await getSecretaryGatepassDetails(gatepassId);
        setGatepass(gpRes.data.gatepass);

        if (gpRes.data.gatepass?.student?._id) {
          const historyRes = await getStudentOSHistory(gpRes.data.gatepass.student._id);
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

  const openConfirmModal = (decision) => {
    if (decision === 'rejected') {
      // For rejection, show rejection reason modal first
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
      const res = await decideOutstationGatepass({
        gatepassId,
        decision: 'rejected',
        classesMissed,
        missedDays: Number(missedDays),
        previousLeavesTaken,
        rejectionReason
      });
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
      const res = await decideOutstationGatepass({
        gatepassId,
        decision,
        classesMissed,
        missedDays: Number(missedDays),
        previousLeavesTaken
      });
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

  if (loading) return <div className="os-loading">Loading details...</div>;
  if (error) return <div className="os-error">{error}</div>;
  if (!gatepass) return <div className="os-error">Gatepass not found</div>;

  return (
    <div className="os-details-view">
      <button className="os-back-btn" onClick={onBack}>
        ← Back to Requests
      </button>

      <h2 className="os-section-title">Gatepass Details</h2>

      {/* Main Details Card */}
      <div className="os-details-card">
        {/* Student Profile Section */}
        <div className="os-student-profile-section">
          <div className="os-student-photo-large">
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

        {/* Previous Leaves Taken Input (Secretary fills this) */}
        <div className="os-classes-section">
          <h4>Previous Leaves Taken (Fill by Secretary)</h4>
          <textarea
            className="os-previous-leaves-input"
            placeholder="Enter details of previous leaves taken by this student..."
            value={previousLeavesTaken}
            onChange={(e) => setPreviousLeavesTaken(e.target.value)}
            rows={3}
          />
        </div>

        {/* Classes Missed Input (Secretary fills this) */}
        <div className="os-classes-section">
          <h4>Classes Missed (Fill by Secretary)</h4>
          <div className="os-classes-row">
            <label>
              <input
                type="radio"
                name="classesMissed"
                value="no"
                checked={classesMissed === 'no'}
                onChange={(e) => setClassesMissed(e.target.value)}
              />
              No classes missed
            </label>
            <label>
              <input
                type="radio"
                name="classesMissed"
                value="yes"
                checked={classesMissed === 'yes'}
                onChange={(e) => setClassesMissed(e.target.value)}
              />
              Classes will be missed
            </label>
            {classesMissed === 'yes' && (
              <input
                type="number"
                min="0"
                value={missedDays}
                onChange={(e) => setMissedDays(e.target.value)}
                placeholder="Days"
                className="os-days-input"
              />
            )}
          </div>
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
            Approve & Pass to DUGC
          </button>
        </div>
      </div>

      {/* Student History */}
      <h3 className="os-history-title">Student's Previous Outstation Gatepasses</h3>
      <div className="os-history-list">
        {studentHistory.filter(h => h._id !== gatepassId).length === 0 && (
          <div className="os-empty">No previous outstation gatepasses</div>
        )}
        {studentHistory.filter(h => h._id !== gatepassId).map((h) => (
          <div key={h._id} className={`os-history-item ${h.finalStatus}`}>
            <div className="os-history-header">
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

  const fetchHistory = async (searchQuery = '') => {
    try {
      setError('');
      setLoading(true);
      const res = await getSecretaryGatepassHistory(searchQuery);
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

  return (
    <div className="os-section">
      <div className="os-history-header-row">
        <h2 className="os-section-title">Gatepass History</h2>
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
        {gatepasses.map((gp) => (
          <div key={gp._id} className={`os-history-row ${gp.stageStatus?.officeSecretary?.status}`}>
            <div className="os-history-student">
              <div className="os-history-name">{gp.studentName}</div>
              <div className="os-history-meta">{gp.rollnumber} • {gp.course} • {gp.department}</div>
            </div>
            <div className="os-history-leave">
              <span>{formatDate(gp.dateOut)} - {formatDate(gp.dateIn)}</span>
              <span className="os-history-reason-text">{gp.reasonOfLeave}</span>
            </div>
            <div className={`os-status-badge ${gp.stageStatus?.officeSecretary?.status}`}>
              {gp.stageStatus?.officeSecretary?.status === 'approved' ? 'PASSED TO DUGC' : 'REJECTED'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfficeSecretaryPage;
