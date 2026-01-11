import React, { useState, useEffect } from 'react';
import {
  getHodPendingGatepasses,
  getHodGatepassDetails,
  getHodStudentOSHistory,
  getHodGatepassHistory,
  decideHodGatepass,
} from '../api/api';
import PopupBox from '../components/PopupBox';
import '../styles/student.css';

// Icons
const IconGrid = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconHistory = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6h8M8 10h8M8 14h5" />
    <circle cx="16" cy="18" r="2" fill="currentColor" />
  </svg>
);

const HodPage = () => {
  const [activePage, setActivePage] = useState('requests');
  const [viewingGatepass, setViewingGatepass] = useState(null);

  const sidebarItems = [
    { id: 'requests', icon: <IconGrid />, label: 'Requests' },
    { id: 'history', icon: <IconHistory />, label: 'History' },
  ];

  return (
    <div className="guard-layout">
      <header className="guard-header">
        <div className="guard-header-brand">
          <span className="guard-header-passly">GoThru</span>
          <span className="guard-header-by">
            by <strong>Watchr</strong>
          </span>
        </div>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.5)',
        }} />
      </header>
      <div className="guard-body">
        {/* Sidebar */}
        <aside style={{
          width: '70px',
          background: 'linear-gradient(180deg, rgba(149, 147, 227, 1), rgba(82, 81, 125, 1))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '20px',
          gap: '8px',
        }}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActivePage(item.id); setViewingGatepass(null); }}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '10px',
                border: activePage === item.id ? '2px solid rgba(255,255,255,0.8)' : 'none',
                background: activePage === item.id ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="guard-main" style={{ padding: '20px', flexDirection: 'column', alignItems: 'stretch', overflow: 'auto' }}>
          {activePage === 'requests' && !viewingGatepass && (
            <RequestsCardView onViewDetails={setViewingGatepass} />
          )}
          {activePage === 'requests' && viewingGatepass && (
            <GatepassDetailsView gatepassId={viewingGatepass} onBack={() => setViewingGatepass(null)} />
          )}
          {activePage === 'history' && <HistoryPage />}
        </main>
      </div>
    </div>
  );
};

// Card view for pending requests
const RequestsCardView = ({ onViewDetails }) => {
  const [gatepasses, setGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGatepasses = async () => {
    try {
      setError('');
      const res = await getHodPendingGatepasses();
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

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontWeight: 700 }}>OUTSTATION GATEPASS REQUESTS (HOD)</h2>

      {loading && <p>Loading requests...</p>}
      {error && <p style={{ color: '#b00020', fontWeight: 600 }}>{error}</p>}

      {!loading && gatepasses.length === 0 && (
        <p style={{ opacity: 0.7 }}>No pending outstation gatepass requests</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {gatepasses.map((gp) => (
          <div
            key={gp._id}
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Avatar/Photo */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e0e0e0, #f5f5f5)',
              border: '2px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {gp.student?.imageUrl ? (
                <img
                  src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${gp.student.imageUrl}`}
                  alt="Student"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#999">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M12 14c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                Name: {gp.studentName}
              </div>
              <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
                Course: {gp.course}<br />
                Roll No: {gp.rollnumber}<br />
                Branch: {gp.branch}<br />
                Contact No: {gp.contact}
              </div>
            </div>

            {/* View Details Button */}
            <button
              onClick={() => onViewDetails(gp._id)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #333',
                background: '#fff',
                color: '#333',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Gatepass Details View with student history
const GatepassDetailsView = ({ gatepassId, onBack }) => {
  const [gatepass, setGatepass] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setError('');
        const gpRes = await getHodGatepassDetails(gatepassId);
        setGatepass(gpRes.data.gatepass);

        // Fetch student's OS gatepass history
        if (gpRes.data.gatepass?.student?._id) {
          const historyRes = await getHodStudentOSHistory(gpRes.data.gatepass.student._id);
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

  const handleDecision = async (decision) => {
    setDeciding(true);
    try {
      const res = await decideHodGatepass({ gatepassId, decision });
      setPopupMessage(res.data.message);
      setTimeout(() => onBack(), 1500);
    } catch (err) {
      setPopupMessage(err?.response?.data?.message || 'Failed to process decision');
    } finally {
      setDeciding(false);
    }
  };

  if (loading) return <p>Loading details...</p>;
  if (error) return <p style={{ color: '#b00020' }}>{error}</p>;
  if (!gatepass) return <p>Gatepass not found</p>;

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        ← Back to Requests
      </button>

      <h2 style={{ marginBottom: '16px', fontWeight: 700 }}>GATEPASS DETAILS</h2>

      {/* Gatepass Details Card */}
      <div style={{
        background: 'rgba(227, 183, 236, 0.85)',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
          <div><b>Student Name:</b> {gatepass.studentName}</div>
          <div><b>Roll Number:</b> {gatepass.rollnumber}</div>
          <div><b>Course:</b> {gatepass.course}</div>
          <div><b>Department:</b> {gatepass.department}</div>
          <div><b>Room Number:</b> {gatepass.roomNumber}</div>
          <div><b>Contact:</b> {gatepass.contact}</div>
          <div><b>Leave Days:</b> {gatepass.leaveDays}</div>
          <div><b>Classes Missed:</b> {gatepass.classesMissed} ({gatepass.missedDays} days)</div>
          <div><b>Date Out:</b> {formatDate(gatepass.dateOut)}</div>
          <div><b>Time Out:</b> {formatTime12hr(gatepass.timeOut)}</div>
          <div><b>Date In:</b> {formatDate(gatepass.dateIn)}</div>
          <div><b>Time In:</b> {formatTime12hr(gatepass.timeIn)}</div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '14px' }}>
          <div><b>Address During Leave:</b> {gatepass.address}</div>
          <div><b>Nature of Leave:</b> {gatepass.natureOfLeave}</div>
          <div><b>Reason:</b> {gatepass.reasonOfLeave}</div>
        </div>

        {/* Previous Stage Decisions */}
        <div style={{
          marginTop: '16px',
          padding: '10px',
          background: 'rgba(255,255,255,0.5)',
          borderRadius: '8px',
          fontSize: '13px',
        }}>
          {gatepass.stageStatus?.officeSecretary?.status && (
            <div style={{ marginBottom: '6px' }}>
              <b>Office Secretary:</b>{' '}
              <span style={{ color: gatepass.stageStatus.officeSecretary.status === 'approved' ? '#16a34a' : '#dc2626' }}>
                {gatepass.stageStatus.officeSecretary.status.toUpperCase()}
              </span>
            </div>
          )}
          {gatepass.stageStatus?.dugc?.status && (
            <div>
              <b>DUGC:</b>{' '}
              <span style={{ color: gatepass.stageStatus.dugc.status === 'approved' ? '#16a34a' : '#dc2626' }}>
                {gatepass.stageStatus.dugc.status.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <button
            onClick={() => handleDecision('rejected')}
            disabled={deciding}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              cursor: deciding ? 'not-allowed' : 'pointer',
              opacity: deciding ? 0.6 : 1,
            }}
          >
            Reject
          </button>
          <button
            onClick={() => handleDecision('approved')}
            disabled={deciding}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: '#16a34a',
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              cursor: deciding ? 'not-allowed' : 'pointer',
              opacity: deciding ? 0.6 : 1,
            }}
          >
            Final Approve
          </button>
        </div>
      </div>

      {/* Student's OS Gatepass History */}
      <h3 style={{ fontWeight: 700, marginBottom: '12px' }}>Student's Outstation Gatepass History</h3>
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: '10px',
        padding: '12px',
      }}>
        {studentHistory.length === 0 && (
          <p style={{ opacity: 0.7, textAlign: 'center' }}>No previous outstation gatepasses</p>
        )}
        {studentHistory.filter(h => h._id !== gatepassId).map((h) => (
          <div
            key={h._id}
            style={{
              padding: '12px',
              marginBottom: '10px',
              background: h.finalStatus === 'approved' ? 'rgba(200, 240, 200, 0.8)'
                : h.finalStatus === 'rejected' ? 'rgba(255, 200, 200, 0.8)'
                  : 'rgba(255, 240, 200, 0.8)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700 }}>{h.reasonOfLeave}</span>
              <span style={{
                fontWeight: 700,
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: h.finalStatus === 'approved' ? 'rgba(22,163,74,0.2)'
                  : h.finalStatus === 'rejected' ? 'rgba(220,38,38,0.2)' : 'rgba(245,158,11,0.2)',
                color: h.finalStatus === 'approved' ? '#16a34a'
                  : h.finalStatus === 'rejected' ? '#dc2626' : '#f59e0b',
              }}>
                {h.finalStatus?.toUpperCase() || 'PENDING'}
              </span>
            </div>
            <div style={{ opacity: 0.85, lineHeight: 1.5 }}>
              <div><b>Out:</b> {formatDate(h.dateOut)} | <b>In:</b> {formatDate(h.dateIn)}</div>
              {h.address && <div><b>Address:</b> {h.address}</div>}
              {h.classesMissed === 'yes' && h.missedDays > 0 && (
                <div><b>Classes Missed:</b> {h.missedDays} days</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <PopupBox message={popupMessage} onClose={() => setPopupMessage('')} />
    </div>
  );
};

// History Page
const HistoryPage = () => {
  const [gatepasses, setGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchHistory = async (searchQuery = '') => {
    try {
      setError('');
      setLoading(true);
      const res = await getHodGatepassHistory(searchQuery);
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontWeight: 700, margin: 0 }}>GATEPASS HISTORY (HOD)</h2>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search student"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              border: '1px solid rgba(0,0,0,0.2)',
              background: '#fff',
              width: '200px',
            }}
          />
        </form>
      </div>

      {loading && <p>Loading history...</p>}
      {error && <p style={{ color: '#b00020' }}>{error}</p>}

      {!loading && gatepasses.length === 0 && (
        <p style={{ opacity: 0.7 }}>No history found</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {gatepasses.map((gp) => (
          <div
            key={gp._id}
            style={{
              background: gp.stageStatus?.hod?.status === 'approved'
                ? 'rgba(200, 240, 200, 0.8)'
                : 'rgba(255, 200, 200, 0.8)',
              borderRadius: '10px',
              padding: '12px 16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{gp.studentName}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {gp.rollnumber} | {gp.course} | {gp.department}
                </div>
              </div>
              <span style={{
                fontWeight: 700,
                fontSize: '12px',
                color: gp.stageStatus?.hod?.status === 'approved' ? '#16a34a' : '#dc2626',
              }}>
                {gp.stageStatus?.hod?.status === 'approved' ? 'APPROVED' : 'REJECTED'}
              </span>
            </div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>
              <b>Leave:</b> {formatDate(gp.dateOut)} - {formatDate(gp.dateIn)} | <b>Reason:</b> {gp.reasonOfLeave}
              {gp.gatePassNo && <span> | <b>Pass No:</b> {gp.gatePassNo}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HodPage;
