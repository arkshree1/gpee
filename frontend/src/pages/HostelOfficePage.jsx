import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '../api/api';
import PopupBox from '../components/PopupBox';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/admin.css';

const HostelOfficePage = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('local-requests');
  const [viewingGatepass, setViewingGatepass] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    return `${day}/${month}/${year} ${hours}:${mins} ${ampm}`;
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
            <div className="os-card-avatar">
              {gp.student?.imageUrl ? (
                <img
                  src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${gp.student.imageUrl}`}
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
    </div>
  );
};

const LocalGatepassDetailsView = ({ gatepassId, onBack }) => {
  const [gatepasses, setGatepasses] = useState([]);
  const [gatepass, setGatepass] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, decision: null });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setError('');
        const res = await getPendingGatepasses();
        const allGatepasses = res.data.gatepasses || [];
        setGatepasses(allGatepasses);
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
    return `${day} ${month} ${hours}:${mins} ${ampm}`;
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
        <div className="os-details-grid">
          <div className="os-detail-item">
            <span className="os-detail-label">Student Name</span>
            <span className="os-detail-value">{gatepass.studentName}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Roll Number</span>
            <span className="os-detail-value">{gatepass.rollnumber}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Place</span>
            <span className="os-detail-value">{gatepass.place}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Purpose</span>
            <span className="os-detail-value">{gatepass.purpose}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Requested Exit</span>
            <span className="os-detail-value">{formatTime12hr(gatepass.timeOut)}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Requested Return</span>
            <span className="os-detail-value">{formatTime12hr(gatepass.timeIn)}</span>
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
      <PopupBox message={popupMessage} onClose={() => setPopupMessage('')} />
    </div>
  );
};

const LocalHistoryView = () => {
  const [gatepasses, setGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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
        {gatepasses.map((gp) => (
          <div key={gp._id} className={`os-history-row ${gp.status}`}>
            <div className="os-history-student">
              <div className="os-history-name">{gp.studentName}</div>
              <div className="os-history-meta">{gp.rollnumber}</div>
            </div>
            <div className="os-history-leave">
              <span>{gp.place}</span>
              <span className="os-history-reason-text">{gp.purpose}</span>
            </div>
            <div className={`os-status-badge ${gp.status}`}>
              {gp.status?.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== OUTSTATION GATEPASS VIEWS ====================

const OSRequestsView = ({ onViewDetails }) => {
  const [gatepasses, setGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return `${day}/${month}/${year} ${hours}:${mins} ${ampm}`;
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

const OSGatepassDetailsView = ({ gatepassId, onBack }) => {
  const [gatepass, setGatepass] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, decision: null });

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
    return `${day}/${month}/${year} ${hours}:${mins} ${ampm}`;
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
        <div className="os-details-grid">
          <div className="os-detail-item">
            <span className="os-detail-label">Student Name</span>
            <span className="os-detail-value">{gatepass.studentName}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Roll Number</span>
            <span className="os-detail-value">{gatepass.rollnumber}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Course</span>
            <span className="os-detail-value">{gatepass.course}</span>
          </div>
          <div className="os-detail-item">
            <span className="os-detail-label">Department</span>
            <span className="os-detail-value">{gatepass.department}</span>
          </div>
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
              <a
                href={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${gatepass.proofFile}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', cursor: 'pointer' }}
              >
                {gatepass.proofFile.endsWith('.pdf') ? (
                  <span style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                    View PDF Document
                  </span>
                ) : (
                  <img
                    src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${gatepass.proofFile}`}
                    alt="Proof Document - Click to open"
                    style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                  />
                )}
              </a>
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
          {gatepass.stageStatus?.dugc?.decidedAt && (
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
      <PopupBox message={popupMessage} onClose={() => setPopupMessage('')} />
    </div>
  );
};

const OSHistoryView = () => {
  const [gatepasses, setGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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
        {gatepasses.map((gp) => (
          <div key={gp._id} className={`os-history-row ${gp.stageStatus?.hostelOffice?.status}`}>
            <div className="os-history-student">
              <div className="os-history-name">{gp.studentName}</div>
              <div className="os-history-meta">{gp.rollnumber} • {gp.course} • {gp.department}</div>
            </div>
            <div className="os-history-leave">
              <span>{formatDate(gp.dateOut)} - {formatDate(gp.dateIn)}</span>
              <span className="os-history-reason-text">{gp.reasonOfLeave}</span>
            </div>
            <div className={`os-status-badge ${gp.stageStatus?.hostelOffice?.status}`}>
              {gp.stageStatus?.hostelOffice?.status === 'approved' ? 'APPROVED' : 'REJECTED'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HostelOfficePage;
