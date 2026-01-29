import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getPendingGatepasses,
  getGatepassHistory,
  decideGatepass,
  getLocalStudentHistory,
  getHostelOfficeOSPendingGatepasses,
  getHostelOfficeOSGatepassDetails,
  getHostelOfficeOSStudentHistory,
  getHostelOfficeOSGatepassHistory,
  decideHostelOfficeOSGatepass,

  getImageUrl,
  getEntryExitLogs,
} from '../api/api';
import PopupBox from '../components/PopupBox';
import ConfirmModal from '../components/ConfirmModal';
import StudentIdCardPopup from '../components/StudentIdCardPopup';
import GuardEntryExitTable from '../components/GuardEntryExitTable';
import '../styles/admin.css';

const HostelOfficePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePage, setActivePage] = useState(() => searchParams.get('page') || 'local-requests');

  // Persist activePage to URL
  useEffect(() => {
    setSearchParams({ page: activePage }, { replace: true });
  }, [activePage, setSearchParams]);
  const [viewingGatepass, setViewingGatepass] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingLocalCount, setPendingLocalCount] = useState(0);
  const [pendingOSCount, setPendingOSCount] = useState(0);

  useEffect(() => {
    document.documentElement.classList.add('admin-page-active');
    document.body.classList.add('admin-page-active');
    return () => {
      document.documentElement.classList.remove('admin-page-active');
      document.body.classList.remove('admin-page-active');
    };
  }, []);

  // Fetch pending counts for sidebar badges
  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        const [localRes, osRes] = await Promise.all([
          getPendingGatepasses(),
          getHostelOfficeOSPendingGatepasses()
        ]);
        setPendingLocalCount(localRes.data.gatepasses?.length || 0);
        setPendingOSCount(osRes.data.gatepasses?.length || 0);
      } catch (err) {
        console.error('Failed to fetch pending counts', err);
      }
    };
    fetchPendingCounts();
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
          <span className="admin-header-role">Hostel Office</span>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-body">
        <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <nav className="admin-sidebar-nav">
            {/* Local Gatepass Section */}
            <div className="admin-nav-section-title">Local Gatepass</div>
            <button
              className={`admin-nav-item ${activePage === 'local-requests' ? 'active' : ''}`}
              onClick={() => handleNavClick('local-requests')}
            >
              <svg className="admin-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="admin-nav-label">Current Requests</span>
              {pendingLocalCount > 0 && (
                <span className="admin-nav-badge pulse">{pendingLocalCount}</span>
              )}
            </button>
            <button
              className={`admin-nav-item ${activePage === 'local-history' ? 'active' : ''}`}
              onClick={() => handleNavClick('local-history')}
            >
              <svg className="admin-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="admin-nav-label">History</span>
            </button>

            {/* Logs Section */}
            <div className="admin-nav-section-title" style={{ marginTop: '20px' }}>Logs</div>
            <button
              className={`admin-nav-item ${activePage === 'log-register' ? 'active' : ''}`}
              onClick={() => handleNavClick('log-register')}
            >
              <svg className="admin-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span className="admin-nav-label">Log Register</span>
            </button>

            {/* Outstation Gatepass Section */}
            <div className="admin-nav-section-title" style={{ marginTop: '20px' }}>Outstation Gatepass</div>
            <button
              className={`admin-nav-item ${activePage === 'os-requests' ? 'active' : ''}`}
              onClick={() => handleNavClick('os-requests')}
            >
              <svg className="admin-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="admin-nav-label">Current Requests</span>
              {pendingOSCount > 0 && (
                <span className="admin-nav-badge pulse">{pendingOSCount}</span>
              )}
            </button>
            <button
              className={`admin-nav-item ${activePage === 'os-history' ? 'active' : ''}`}
              onClick={() => handleNavClick('os-history')}
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
            {/* Local Gatepass Views */}
            {activePage === 'local-requests' && !viewingGatepass && (
              <LocalRequestsView onViewDetails={setViewingGatepass} />
            )}
            {activePage === 'local-requests' && viewingGatepass && (
              <LocalGatepassDetailsView gatepassId={viewingGatepass} onBack={() => setViewingGatepass(null)} />
            )}
            {activePage === 'local-history' && <LocalHistoryView />}
            {activePage === 'log-register' && <LogRegisterView />}

            {/* Outstation Gatepass Views */}
            {activePage === 'os-requests' && !viewingGatepass && (
              <OSRequestsView onViewDetails={setViewingGatepass} />
            )}
            {activePage === 'os-requests' && viewingGatepass && (
              <OSGatepassDetailsView gatepassId={viewingGatepass} onBack={() => setViewingGatepass(null)} />
            )}
            {activePage === 'os-history' && <OSHistoryView />}
          </div>
        </main>
      </div>
    </div>
  );
};

// ==================== LOCAL GATEPASS VIEWS ====================

const LocalRequestsView = ({ onViewDetails }) => {
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
      course: gatepass.course,
      semester: gatepass.semester,
    });
    setShowIdCard(true);
  };

  const fetchGatepasses = async () => {
    try {
      setError('');
      const res = await getPendingGatepasses();
      setGatepasses(res.data.gatepasses || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch gatepasses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatepasses();
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
      <h2 className="os-section-title">Pending Local Gatepass Requests</h2>

      {loading && <div className="os-loading">Loading requests...</div>}
      {error && <div className="os-error">{error}</div>}

      {!loading && gatepasses.length === 0 && (
        <div className="os-empty">No pending local gatepass requests</div>
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
                  src={getImageUrl(gp.student.imageUrl)}
                  alt={gp.studentName}
                  className="os-card-avatar-img"
                />
              ) : (
                <span style={{ fontSize: '20px', color: '#fff' }}>●</span>
              )}
            </div>
            <div className="os-card-info">
              <div className="os-card-name">{gp.studentName}</div>
              <div className="os-card-details">
                <span>{gp.rollnumber}</span>
              </div>
              <div className="os-card-branch">{gp.place}</div>
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

const LocalGatepassDetailsView = ({ gatepassId, onBack }) => {

  const [gatepass, setGatepass] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, decision: null });

  // ID Card popup state
  const [showIdCard, setShowIdCard] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setError('');
        const res = await getPendingGatepasses();
        const allGatepasses = res.data.gatepasses || [];

        const found = allGatepasses.find(gp => gp._id === gatepassId);
        setGatepass(found || null);

        // Fetch student history if gatepass found
        if (found?.student) {
          setHistoryLoading(true);
          try {
            // Handle both populated object and plain ID
            const studentId = typeof found.student === 'object' ? found.student._id : found.student;
            const historyRes = await getLocalStudentHistory(studentId);
            setStudentHistory(historyRes.data.gatepasses || []);
          } catch (histErr) {
            console.error('Failed to fetch student history:', histErr);
          } finally {
            setHistoryLoading(false);
          }
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [gatepassId]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = monthNames[d.getMonth()];
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day} ${month}, ${hours}:${mins} ${ampm}`;
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

  const formatDateTimeFromParts = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '--';
    // dateStr is like "2026-01-17", timeStr is like "12:06"
    const dateParts = dateStr.split('-');
    if (dateParts.length !== 3) return '--';
    const [, monthNum, day] = dateParts;
    const month = monthNames[parseInt(monthNum, 10) - 1];
    const formattedTime = formatTime12hr(timeStr);
    return `${parseInt(day, 10)} ${month} ${formattedTime}`;
  };

  const openConfirmModal = (decision) => {
    setConfirmModal({ open: true, decision });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, decision: null });
  };

  const handleDecision = async (decision) => {
    setDeciding(true);
    try {
      const res = await decideGatepass({ gatepassId, decision });
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

      <h2 className="os-section-title">Local Gatepass Details</h2>

      <div className="os-details-card">
        {/* Student Image and Name */}
        <div className="os-student-info-header">
          <div
            className="os-student-avatar-large profile-pic-hover"
            onClick={() => setShowIdCard(true)}
            title="Click to view GoThru ID Card"
          >
            {gatepass.student?.imageUrl ? (
              <img
                src={getImageUrl(gatepass.student.imageUrl)}
                alt={gatepass.studentName}
              />
            ) : (
              <span className="os-avatar-placeholder">{gatepass.studentName?.charAt(0)?.toUpperCase() || '?'}</span>
            )}
          </div>
          <div className="os-student-header-info">
            <h3 className="os-student-name-large">{gatepass.studentName}</h3>
            <span className="os-student-roll-large">{gatepass.rollnumber}</span>
          </div>
        </div>

        <div className="os-details-grid">
          <div className="os-detail-item">
            <span className="os-detail-label">Place</span>
            <span className="os-detail-value">{gatepass.place}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Purpose</span>
            <span className="os-detail-value">{gatepass.purpose}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Course</span>
            <span className="os-detail-value">{gatepass.course || '--'}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Semester</span>
            <span className="os-detail-value">{gatepass.semester || '--'}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Requested Exit</span>
            <span className="os-detail-value">{formatDateTimeFromParts(gatepass.dateOut, gatepass.timeOut)}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Requested Return</span>
            <span className="os-detail-value">{formatDateTimeFromParts(gatepass.dateIn, gatepass.timeIn)}</span>
          </div>
        </div>

        {/* Approval Timeline */}
        <div className="os-approval-timeline">
          <h4>Approval Timeline</h4>
          <div className="os-timeline-item">
            <span className="os-timeline-label">Student Applied</span>
            <span className="os-timeline-value">{formatDateTime(gatepass.createdAt)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="os-action-btns">
          <button
            className="os-reject-btn"
            onClick={() => openConfirmModal('denied')}
            disabled={deciding}
          >
            Reject
          </button>
          <button
            className="os-approve-btn"
            onClick={() => openConfirmModal('approved')}
            disabled={deciding}
          >
            Approve
          </button>
        </div>
      </div>

      {/* Student's Local Gatepass History */}
      <div className="os-student-history-section">
        <h3 className="os-history-title">Student's Previous Local Gatepasses</h3>
        {historyLoading && <div className="os-loading">Loading history...</div>}
        {!historyLoading && studentHistory.length === 0 && (
          <div className="os-empty">No previous local gatepasses</div>
        )}
        {!historyLoading && studentHistory.length > 0 && (
          <div className="os-history-table local-history-table">
            <div className="local-history-header">
              <span>GP No.</span>
              <span>Status</span>
              <span>Place</span>
              <span>Requested Out</span>
              <span>Requested In</span>
              <span>Actual Out</span>
              <span>Actual In</span>
            </div>
            {studentHistory.map((gp) => (
              <div key={gp._id} className={`local-history-row ${gp.status}`}>
                <span className="local-history-gpno">{gp.gatePassNo || '--'}</span>
                <span className={`local-history-status ${gp.status}`}>
                  {gp.status === 'approved' ? 'Approved' : gp.status === 'denied' ? 'Denied' : gp.status}
                </span>
                <span className="local-history-place">{gp.place || '--'}</span>
                <span className="local-history-time">{formatDateTimeFromParts(gp.dateOut, gp.timeOut)}</span>
                <span className="local-history-time">{formatDateTimeFromParts(gp.dateIn, gp.timeIn)}</span>
                <span className="local-history-time">{gp.actualExitAt ? formatDateTime(gp.actualExitAt) : '--'}</span>
                <span className="local-history-time">{gp.actualEntryAt ? formatDateTime(gp.actualEntryAt) : '--'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={closeConfirmModal}
        onConfirm={() => handleDecision(confirmModal.decision)}
        decision={confirmModal.decision}
        studentName={gatepass?.studentName}
        rollNumber={gatepass?.rollnumber}
        isLocal={true}
        place={gatepass?.place}
        purpose={gatepass?.purpose}
        isProcessing={deciding}
      />

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

const LocalHistoryView = () => {
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
      course: gp.course,
      semester: gp.semester,
    });
    setShowIdCard(true);
  };

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const fetchHistory = async (searchQuery = '') => {
    try {
      setError('');
      setLoading(true);
      const res = await getGatepassHistory(searchQuery);
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
    setPopupLoading(false);
    // Use the row data directly since it includes all needed info
    setPopupData({
      student: {
        ...gp.student,
        name: gp.studentName,
        rollnumber: gp.rollnumber,
      },
      gatePassNo: gp.gatePassNo,
      gatepassDetails: {
        purpose: gp.purpose,
        place: gp.place,
        status: gp.status,
        dateOut: gp.dateOut,
        dateIn: gp.dateIn,
        timeOut: gp.timeOut,
        timeIn: gp.timeIn,
        actualExitAt: gp.actualExitAt,
        actualEntryAt: gp.actualEntryAt,
        appliedAt: gp.createdAt,
        approvedAt: gp.decidedAt,
      }
    });
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupData(null);
  };

  return (
    <div className="os-section">
      <div className="os-history-header-row">
        <h2 className="os-section-title">Local Gatepass History</h2>
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
          const status = gp.status || 'pending';

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
                <div className="os-history-meta">{gp.rollnumber}</div>
              </div>

              {/* Gatepass Number */}
              {hasGatepassNo ? (
                <span className="os-history-gp-number">{gp.gatePassNo}</span>
              ) : status !== 'rejected' ? (
                <span className="os-history-gp-pending">Yet to be Approved</span>
              ) : null}

              {/* Leave Info */}
              <div className="os-history-leave-enhanced">
                <span>{gp.place}</span>
                <span className="os-history-reason-text">{gp.purpose}</span>
              </div>

              {/* Status Badge */}
              <div className={`os-status-badge ${status}`}>
                {status?.toUpperCase()}
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
              <h3>Local Gatepass Details</h3>
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
                    <span className="gatepass-popup-type-badge local">LOCAL</span>
                    <span className="gatepass-popup-number-badge">{popupData.gatePassNo}</span>
                    <span className={`gatepass-popup-status-badge ${popupData.gatepassDetails?.status}`}>
                      {popupData.gatepassDetails?.status || 'Pending'}
                    </span>
                  </div>

                  <div className="gatepass-popup-details">
                    <div className="gatepass-popup-detail-item">
                      <span className="gatepass-popup-detail-label">Purpose</span>
                      <span className="gatepass-popup-detail-value">{popupData.gatepassDetails?.purpose || '--'}</span>
                    </div>
                    <div className="gatepass-popup-detail-item">
                      <span className="gatepass-popup-detail-label">Place</span>
                      <span className="gatepass-popup-detail-value">{popupData.gatepassDetails?.place || '--'}</span>
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
                    <h5>Timeline</h5>
                    <div className="gatepass-popup-timeline-list">
                      <div className="gatepass-popup-timeline-item">
                        <span className="gatepass-popup-timeline-stage">Applied</span>
                        <span className="gatepass-popup-timeline-time">
                          {formatDateTime(popupData.gatepassDetails?.appliedAt) || '--'}
                        </span>
                      </div>
                      {popupData.gatepassDetails?.approvedAt && (
                        <div className="gatepass-popup-timeline-item approved">
                          <span className="gatepass-popup-timeline-stage">Approved</span>
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

// ==================== OUTSTATION GATEPASS VIEWS ====================

const OSRequestsView = ({ onViewDetails }) => {
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
      course: gatepass.course,
    });
    setShowIdCard(true);
  };

  const fetchGatepasses = async () => {
    try {
      setError('');
      const res = await getHostelOfficeOSPendingGatepasses();
      setGatepasses(res.data.gatepasses || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch gatepasses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatepasses();
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
      <h2 className="os-section-title">Pending Outstation Gatepass Requests (Hostel Office)</h2>

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
                  src={getImageUrl(gp.student.imageUrl)}
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

const OSGatepassDetailsView = ({ gatepassId, onBack }) => {
  const [gatepass, setGatepass] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, decision: null });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDocPopup, setShowDocPopup] = useState(false);

  // ID Card popup state
  const [showIdCard, setShowIdCard] = useState(false);

  // History gatepass popup state
  const [historyPopup, setHistoryPopup] = useState({ open: false, gatepass: null });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setError('');
        const gpRes = await getHostelOfficeOSGatepassDetails(gatepassId);
        setGatepass(gpRes.data.gatepass);

        if (gpRes.data.gatepass?.student?._id) {
          const historyRes = await getHostelOfficeOSStudentHistory(gpRes.data.gatepass.student._id);
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
    return `${day}/${month}/${year},  ${hours}:${mins} ${ampm}`;
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
      const res = await decideHostelOfficeOSGatepass({ gatepassId, decision: 'rejected', rejectionReason });
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
      const res = await decideHostelOfficeOSGatepass({ gatepassId, decision });
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

      <h2 className="os-section-title">Outstation Gatepass Details</h2>

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
                src={getImageUrl(gatepass.student.imageUrl)}
                alt={gatepass.studentName}
              />
            ) : (
              <div className="os-photo-placeholder">👤</div>
            )}
          </div>
          <div className="os-student-basic-info">
            <h3 className="os-student-name">{gatepass.studentName}</h3>
            <p className="os-student-roll">{gatepass.rollnumber}</p>
            <p className="os-student-branch">{gatepass.course} • {gatepass.department}</p>
          </div>
        </div>

        <div className="os-details-grid">
          <div className="os-detail-item">
            <span className="os-detail-label">Room Number</span>
            <span className="os-detail-value">{gatepass.roomNumber}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Hostel</span>
            <span className="os-detail-value">{gatepass.hostelName || gatepass.student?.hostelName || '--'}</span>
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

        {/* Previous Leaves Taken - from Office Secretary */}
        {gatepass.previousLeavesTaken && (
          <div className="os-detail-full os-previous-leaves-display">
            <span className="os-detail-label">Previous Leaves Taken (Office Secretary Note)</span>
            <span className="os-detail-value">{gatepass.previousLeavesTaken}</span>
          </div>
        )}

        {/* Notes are intentionally hidden from Hostel Office - they only see the final approval stage */}

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

        {gatepass.proofFile && (
          <div className="os-detail-full" style={{ marginTop: '16px' }}>
            <span className="os-detail-label">Supporting Document</span>
            <div style={{ marginTop: '8px' }}>
              <button
                className="os-view-doc-btn"
                onClick={() => setShowDocPopup(true)}
              >
                View Document
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
          {/* PhD: Instructor Approved */}
          {gatepass.course === 'PhD' && gatepass.stageStatus?.instructor?.decidedAt && (
            <div className="os-timeline-item approved">
              <span className="os-timeline-label">Instructor Approved</span>
              <span className="os-timeline-value">{formatDateTime(gatepass.stageStatus.instructor.decidedAt)}</span>
            </div>
          )}
          {gatepass.stageStatus?.officeSecretary?.decidedAt && (
            <div className="os-timeline-item approved">
              <span className="os-timeline-label">Office Secretary Approved</span>
              <span className="os-timeline-value">{formatDateTime(gatepass.stageStatus.officeSecretary.decidedAt)}</span>
            </div>
          )}
          {/* PhD: DPGC Approved */}
          {gatepass.course === 'PhD' && gatepass.stageStatus?.dpgc?.decidedAt && (
            <div className="os-timeline-item approved">
              <span className="os-timeline-label">DPGC Approved</span>
              <span className="os-timeline-value">{formatDateTime(gatepass.stageStatus.dpgc.decidedAt)}</span>
            </div>
          )}
          {/* BTech/MBA: DUGC Approved */}
          {gatepass.course !== 'PhD' && gatepass.stageStatus?.dugc?.decidedAt && (
            <div className="os-timeline-item approved">
              <span className="os-timeline-label">DUGC Approved</span>
              <span className="os-timeline-value">{formatDateTime(gatepass.stageStatus.dugc.decidedAt)}</span>
            </div>
          )}
          {gatepass.stageStatus?.hod?.decidedAt && (
            <div className="os-timeline-item approved">
              <span className="os-timeline-label">HOD Approved</span>
              <span className="os-timeline-value">{formatDateTime(gatepass.stageStatus.hod.decidedAt)}</span>
            </div>
          )}
          {/* PhD: Dean Approved */}
          {gatepass.course === 'PhD' && gatepass.stageStatus?.dean?.decidedAt && (
            <div className="os-timeline-item approved">
              <span className="os-timeline-label">Dean Approved</span>
              <span className="os-timeline-value">{formatDateTime(gatepass.stageStatus.dean.decidedAt)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="os-action-btns">
          <button
            className="os-approve-btn"
            onClick={() => openConfirmModal('approved')}
            disabled={deciding}
          >
            Approve (Final)
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

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="doc-popup-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="doc-popup-content" style={{ maxWidth: '500px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <button className="doc-popup-close" onClick={() => setShowRejectModal(false)}>×</button>
            <h3 style={{ marginBottom: '16px' }}>Reject Gatepass</h3>
            <p style={{ marginBottom: '12px' }}>Are you sure you want to reject this gatepass?</p>
            <textarea
              className="rejection-reason-input"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              style={{ width: '100%', marginBottom: '16px', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={deciding}
                style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#dc3545', color: 'white', cursor: 'pointer', opacity: deciding ? 0.6 : 1 }}
              >
                {deciding ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Popup */}
      {showDocPopup && gatepass.proofFile && (
        <div className="doc-popup-overlay" onClick={() => setShowDocPopup(false)}>
          <div className="doc-popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="doc-popup-close" onClick={() => setShowDocPopup(false)}>×</button>
            {gatepass.proofFile.endsWith('.pdf') ? (
              <iframe
                className="doc-popup-iframe"
                src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${gatepass.proofFile}`}
                title="Document Preview"
              />
            ) : (
              <img
                className="doc-popup-image"
                src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${gatepass.proofFile}`}
                alt="Proof Document"
              />
            )}
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

const OSHistoryView = () => {
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
      course: gp.course,
    });
    setShowIdCard(true);
  };

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const fetchHistory = async (searchQuery = '') => {
    try {
      setError('');
      setLoading(true);
      const res = await getHostelOfficeOSGatepassHistory(searchQuery);
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
      const res = await getHostelOfficeOSGatepassDetails(gp._id);
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
        <h2 className="os-section-title">Outstation Gatepass History (Hostel Office)</h2>
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
          const status = gp.stageStatus?.hostelOffice?.status || 'pending';

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
                {status === 'approved' ? 'APPROVED' : 'REJECTED'}
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
              <h3>Outstation Gatepass Details</h3>
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
                    <h5>Utilization Status</h5>
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

const LogRegisterView = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch logs when date or search changes
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await getEntryExitLogs(date, search);
        setLogs(res.data.logs || []);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchLogs();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [date, search]);

  const formatLogTime = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  };

  const handleDownloadExcel = () => {
    if (!logs.length) return;

    const headers = ["Sr No", "Name", "Roll No", "Room No", "Contact", "Place", "Purpose", "Gate Pass", "Time Out", "Time In"];

    const rows = logs.map(log => {
      const srNo = log.srNo || '';
      const name = log.name || '';
      const rollNo = log.rollNo || '';
      const roomNo = log.roomNo || '';
      // Prefix with apostrophe to force Excel to treat as text (apostrophe is hidden in Excel)
      const contact = log.contact ? `'${log.contact}` : '';
      const place = log.place || '';
      const purpose = log.purpose || '';
      const gatePass = log.gatePass || '--';
      const timeOut = formatLogTime(log.timeOut);
      const timeIn = formatLogTime(log.timeIn);

      // Escape quotes properly for CSV
      const escapeCSV = (val) => {
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [srNo, name, rollNo, roomNo, contact, place, purpose, gatePass, timeOut, timeIn]
        .map(escapeCSV)
        .join(',');
    });

    // Add BOM for Excel to recognize UTF-8 encoding
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `EntryExitLogs_${date || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="os-section">
      {/* Header with Title and Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 className="os-section-title" style={{ margin: 0 }}>Entry-Exit Log Register</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '500', fontSize: '14px', color: '#666' }}>DATE</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
            {date && (
              <button
                onClick={() => setDate('')}
                style={{ padding: '8px 12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                All
              </button>
            )}
          </div>
          {/* Search Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '500', fontSize: '14px', color: '#666' }}>SEARCH</label>
            <input
              type="text"
              placeholder="Name or Roll No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', minWidth: '180px' }}
            />
          </div>
          {/* Download Button */}
          <button
            onClick={handleDownloadExcel}
            disabled={logs.length === 0}
            style={{
              background: logs.length === 0 ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📥 Download Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>SR NO.</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>NAME</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>ROLL NO.</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>ROOM NO.</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>CONTACT</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>PLACE</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>PURPOSE</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>GATE PASS</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>TIME OUT</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>TIME IN</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading...</td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No records found</td>
                </tr>
              )}
              {!loading && logs.map((log) => (
                <tr key={log._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: '500' }}>{log.srNo}</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>{log.name}</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>{log.rollNo}</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>{log.roomNo}</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>{log.contact}</td>
                  <td style={{ padding: '12px 16px', color: '#2563eb' }}>{log.place}</td>
                  <td style={{ padding: '12px 16px', color: '#059669' }}>{log.purpose}</td>
                  <td style={{ padding: '12px 16px', color: '#666' }}>{log.gatePass}</td>
                  <td style={{ padding: '12px 16px', color: '#111' }}>{formatLogTime(log.timeOut)}</td>
                  <td style={{ padding: '12px 16px', color: log.timeIn ? '#059669' : '#999', fontWeight: log.timeIn ? '500' : 'normal' }}>
                    {formatLogTime(log.timeIn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HostelOfficePage;

