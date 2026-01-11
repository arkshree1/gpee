import React, { useState, useEffect } from 'react';
import { getPendingGatepasses, decideGatepass, getEntryExitLogs, getGatepassHistory } from '../api/api';
import PopupBox from '../components/PopupBox';
import '../styles/student.css';

// Icons as simple SVG components
const IconGrid = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconLogs = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 8h10M7 12h10M7 16h6" />
  </svg>
);

const IconHistory = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6h8M8 10h8M8 14h5" />
    <circle cx="16" cy="18" r="2" fill="currentColor" />
  </svg>
);

const IconBan = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M5.5 5.5l13 13" />
  </svg>
);

const HostelOfficePage = () => {
  const [activePage, setActivePage] = useState('requests');

  const sidebarItems = [
    { id: 'requests', icon: <IconGrid />, label: 'Requests' },
    { id: 'logs', icon: <IconLogs />, label: 'Logs' },
    { id: 'history', icon: <IconHistory />, label: 'History' },
    { id: 'banned', icon: <IconBan />, label: 'Banned' },
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
              onClick={() => setActivePage(item.id)}
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
          {activePage === 'requests' && <GatepassRequestsPage />}
          {activePage === 'logs' && <EntryExitLogsPage />}
          {activePage === 'history' && <GatepassHistoryPage />}
          {activePage === 'banned' && <BannedPage />}
        </main>
      </div>
    </div>
  );
};

// Page 1: Gatepass Requests
const GatepassRequestsPage = () => {
  const [gatepasses, setGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [decidingId, setDecidingId] = useState(null);

  // Format date as dd/mm/yyyy
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Handle YYYY-MM-DD format from input
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Format time as 12hr AM/PM
  const formatTime12hr = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
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
    const interval = setInterval(fetchGatepasses, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDecision = async (gatepassId, decision) => {
    setDecidingId(gatepassId);
    try {
      const res = await decideGatepass({ gatepassId, decision });
      setPopupMessage(res.data.message || `Gatepass ${decision}`);
      setGatepasses((prev) => prev.filter((g) => g._id !== gatepassId));
    } catch (err) {
      setPopupMessage(err?.response?.data?.message || 'Failed to process decision');
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '16px', fontWeight: 700 }}>GATEPASS APPLICATIONS</h2>

      {loading && <p>Loading gatepasses...</p>}
      {error && <p style={{ color: '#b00020', fontWeight: 600 }}>{error}</p>}

      {!loading && gatepasses.length === 0 && (
        <p style={{ opacity: 0.7 }}>No pending gatepass requests</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {gatepasses.map((gp) => (
          <div
            key={gp._id}
            style={{
              background: 'rgba(227, 183, 236, 0.85)',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid rgba(0,0,0,0.15)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px' }}>{gp.studentName}</div>
                <div style={{ fontSize: '13px', opacity: 0.85 }}>
                  Roll No: {gp.rollnumber} | Dept: {gp.department}
                </div>
              </div>
              <div style={{
                background: 'rgba(153, 4, 182, 0.9)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
              }}>
                {gp.gatePassNo}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
              fontSize: '13px',
              marginBottom: '14px',
            }}>
              <div><span style={{ fontWeight: 600 }}>Room:</span> {gp.roomNumber}</div>
              <div><span style={{ fontWeight: 600 }}>Semester:</span> {gp.semester}</div>
              <div><span style={{ fontWeight: 600 }}>Contact:</span> {gp.contact}</div>
              <div><span style={{ fontWeight: 600 }}>Place:</span> {gp.place}</div>
              <div><span style={{ fontWeight: 600 }}>Date Out:</span> {formatDate(gp.dateOut)}</div>
              <div><span style={{ fontWeight: 600 }}>Time Out:</span> {formatTime12hr(gp.timeOut)}</div>
              <div><span style={{ fontWeight: 600 }}>Date In:</span> {formatDate(gp.dateIn)}</div>
              <div><span style={{ fontWeight: 600 }}>Time In:</span> {formatTime12hr(gp.timeIn)}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleDecision(gp._id, 'approved')}
                disabled={decidingId === gp._id}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#16a34a',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: decidingId === gp._id ? 'not-allowed' : 'pointer',
                  opacity: decidingId === gp._id ? 0.6 : 1,
                }}
              >
                {decidingId === gp._id ? 'Processing...' : 'APPROVE'}
              </button>
              <button
                onClick={() => handleDecision(gp._id, 'denied')}
                disabled={decidingId === gp._id}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: decidingId === gp._id ? 'not-allowed' : 'pointer',
                  opacity: decidingId === gp._id ? 0.6 : 1,
                }}
              >
                DENY
              </button>
            </div>
          </div>
        ))}
      </div>

      <PopupBox message={popupMessage} onClose={() => setPopupMessage('')} />
    </div>
  );
};

// Page 2: Entry-Exit Logs
const EntryExitLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await getEntryExitLogs(selectedDate, search);
      setLogs(res.data.logs || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontWeight: 700, margin: 0 }}>ENTRY-EXIT LOG</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.25)',
              background: '#fff',
            }}
          />
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid rgba(0,0,0,0.25)',
                background: '#fff',
                width: '140px',
              }}
            />
          </form>
        </div>
      </div>

      {loading && <p>Loading logs...</p>}
      {error && <p style={{ color: '#b00020', fontWeight: 600 }}>{error}</p>}

      <div style={{
        background: 'rgba(227, 183, 236, 0.5)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ background: 'rgba(227, 183, 236, 1)' }}>
            <tr>
              <th style={thStyle}>SR NO.</th>
              <th style={thStyle}>NAME</th>
              <th style={thStyle}>ROLL NO.</th>
              <th style={thStyle}>ROOM NO.</th>
              <th style={thStyle}>CONTACT</th>
              <th style={thStyle}>PLACE</th>
              <th style={thStyle}>PURPOSE</th>
              <th style={thStyle}>GATE PASS</th>
              <th style={thStyle}>TIME OUT</th>
              <th style={thStyle}>TIME IN</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={log._id} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}>
                <td style={tdStyle}>{log.srNo}</td>
                <td style={tdStyle}>{log.name}</td>
                <td style={tdStyle}>{log.rollNo}</td>
                <td style={tdStyle}>{log.roomNo}</td>
                <td style={tdStyle}>{log.contact}</td>
                <td style={tdStyle}>{log.place}</td>
                <td style={tdStyle}>{log.purpose}</td>
                <td style={tdStyle}>{log.gatePass}</td>
                <td style={tdStyle}>{formatTime(log.timeOut)}</td>
                <td style={{ ...tdStyle, background: '#6fdd6f', fontWeight: 600, color: '#000' }}>
                  {formatTime(log.timeIn)}
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan="10" style={{ ...tdStyle, textAlign: 'center', opacity: 0.7 }}>
                  No logs found for selected date
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '10px 8px',
  textAlign: 'left',
  fontWeight: 700,
  borderBottom: '1px solid rgba(0,0,0,0.2)',
};

const tdStyle = {
  padding: '8px',
  borderBottom: '1px solid rgba(0,0,0,0.1)',
};

// Page 3: Gatepass History
const GatepassHistoryPage = () => {
  const [gatepasses, setGatepasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Format date as dd/mm/yyyy
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Format time as 12hr AM/PM
  const formatTime12hr = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontWeight: 700, margin: 0 }}>GATEPASS APPLICATIONS</h2>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search Student"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '10px 24px',
              borderRadius: '999px',
              border: '1px solid rgba(0,0,0,0.2)',
              background: 'rgba(255,255,255,0.8)',
              width: '200px',
              fontSize: '14px',
            }}
          />
        </form>
      </div>

      {loading && <p>Loading history...</p>}
      {error && <p style={{ color: '#b00020', fontWeight: 600 }}>{error}</p>}

      {!loading && gatepasses.length === 0 && (
        <p style={{ opacity: 0.7 }}>No gatepass history found</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {gatepasses.map((gp) => (
          <div
            key={gp._id}
            style={{
              background: gp.status === 'approved'
                ? 'rgba(200, 240, 200, 0.8)'
                : 'rgba(255, 200, 200, 0.8)',
              borderRadius: '12px',
              padding: '14px 16px',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{gp.studentName}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {gp.rollnumber} | {gp.department} | Room: {gp.roomNumber}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: gp.status === 'approved' ? '#16a34a' : '#dc2626',
                }}>
                  {gp.status.toUpperCase()}
                </span>
                <span style={{
                  background: 'rgba(153, 4, 182, 0.9)',
                  color: '#fff',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  {gp.gatePassNo}
                </span>
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span><b>Place:</b> {gp.place}</span>
              <span><b>Out:</b> {formatDate(gp.dateOut)} {formatTime12hr(gp.timeOut)}</span>
              <span><b>In:</b> {formatDate(gp.dateIn)} {formatTime12hr(gp.timeIn)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Page 4: Banned Students (Placeholder)
const BannedPage = () => {
  return (
    <div>
      <h1>hi from banned page</h1>
    </div>
  );
};

export default HostelOfficePage;
