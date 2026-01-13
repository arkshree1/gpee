import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminOverview,
  getStudentsInside,
  getStudentsOutside,
  getLocalGatepassExits,
  getOutstationGatepassExits,
  getDetailedLogs
} from '../api/api';
import LiveActivityLogs from '../components/LiveActivityLogs';
import '../styles/admin.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student list modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalStudents, setModalStudents] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Detailed logs state for Students page
  const [detailedLogs, setDetailedLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await getAdminOverview();
      setOverview(res.data);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await getDetailedLogs();
      setDetailedLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load detailed logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activePage === 'dashboard') {
      loadDashboard();
    } else if (activePage === 'students') {
      loadDetailedLogs();
    }
  }, [activePage]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Handle stat card clicks
  const handleCardClick = async (type) => {
    setModalLoading(true);
    setShowModal(true);

    try {
      let res;
      switch (type) {
        case 'inside':
          setModalTitle('Students Inside Campus');
          res = await getStudentsInside();
          break;
        case 'outside':
          setModalTitle('Students Outside Campus');
          res = await getStudentsOutside();
          break;
        case 'local':
          setModalTitle('Local Gatepass Exits');
          res = await getLocalGatepassExits();
          break;
        case 'outstation':
          setModalTitle('Outstation Gatepass Exits');
          res = await getOutstationGatepassExits();
          break;
        default:
          return;
      }
      setModalStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
      setModalStudents([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate total students
  const totalStudents = (overview?.studentsInside || 0) + (overview?.studentsOutside || 0);

  // Sidebar navigation items
  const navItems = [
    { id: 'dashboard', icon: '◫', label: 'Dashboard' },
    { id: 'students', icon: '◑', label: 'Students' },
    { id: 'gatepasses', icon: '▤', label: 'Gatepasses' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
  ];

  // Render page content based on active page
  const renderContent = () => {
    // Dashboard Page
    if (activePage === 'dashboard') {
      if (loading) {
        return <div className="admin-loading">Loading dashboard...</div>;
      }

      return (
        <div className="admin-dashboard-layout">
          {/* Main Dashboard Content */}
          <div className="admin-dashboard-content">
            {/* College Header Banner */}
            <div className="admin-college-banner">
              <h1 className="admin-college-name">RAJIV GANDHI INSTITUTE OF PETROLEUM TECHNOLOGY</h1>
              <p className="admin-college-subtitle">(An Institute of National Importance Established Under an Act of Parliament)</p>
              <h2 className="admin-college-name-hi">राजीव गाँधी पेट्रोलियम प्रौद्योगिकी संस्थान</h2>
              <p className="admin-college-subtitle-hi">(संसद के अधिनियम द्वारा राष्ट्रीय महत्व का संस्थान)</p>
            </div>

            {/* Total Students */}
            <div className="admin-total-students">
              <div className="admin-total-label">Total Students</div>
              <div className="admin-total-value">{totalStudents}</div>
            </div>

            {/* Stats Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card green clickable" onClick={() => handleCardClick('inside')}>
                <div className="admin-stat-value">{overview?.studentsInside || 0}</div>
                <div className="admin-stat-label">Students Inside</div>
              </div>
              <div className="admin-stat-card red clickable" onClick={() => handleCardClick('outside')}>
                <div className="admin-stat-value">{overview?.studentsOutside || 0}</div>
                <div className="admin-stat-label">Students Outside</div>
              </div>
              <div className="admin-stat-card orange clickable" onClick={() => handleCardClick('local')}>
                <div className="admin-stat-value">{overview?.localGatepassExits || 0}</div>
                <div className="admin-stat-label">Local Gatepass Exits</div>
              </div>
              <div className="admin-stat-card purple clickable" onClick={() => handleCardClick('outstation')}>
                <div className="admin-stat-value">{overview?.outstationGatepassExits || 0}</div>
                <div className="admin-stat-label">Outstation Gatepass Exits</div>
              </div>
            </div>
          </div>

          {/* Live Activity Logs Panel */}
          <LiveActivityLogs />
        </div>
      );
    }

    // Students Page - Detailed Activity Logs
    if (activePage === 'students') {
      return (
        <div className="admin-detailed-logs-page">
          <div className="admin-detailed-logs-header">
            <h3 className="admin-detailed-logs-title">Activity Logs</h3>
            <span className="admin-detailed-logs-count">{detailedLogs.length} records</span>
          </div>
          <div className="admin-detailed-logs-table-container">
            {logsLoading ? (
              <div className="admin-loading">Loading logs...</div>
            ) : detailedLogs.length === 0 ? (
              <div className="admin-placeholder">No activity logs found</div>
            ) : (
              <>
                {/* Desktop Table View */}
                <table className="admin-detailed-logs-table desktop-only">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Roll Number</th>
                      <th>Activity</th>
                      <th>Type</th>
                      <th>Contact</th>
                      <th>Place</th>
                      <th>Purpose</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedLogs.map((log, idx) => (
                      <tr key={log.id || idx}>
                        <td>{log.name}</td>
                        <td>{log.rollNumber}</td>
                        <td>
                          <span className={`activity-badge ${log.activity.toLowerCase()}`}>
                            {log.activity}
                          </span>
                        </td>
                        <td>
                          <span className={`type-badge ${log.type === 'Normal' ? 'normal' : log.type.startsWith('OS') ? 'outstation' : 'local'}`}>
                            {log.type}
                          </span>
                        </td>
                        <td>{log.contactNumber}</td>
                        <td>{log.place}</td>
                        <td>{log.purpose}</td>
                        <td className="time-cell">{formatTime(log.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="admin-logs-cards mobile-only">
                  {detailedLogs.map((log, idx) => (
                    <div key={log.id || idx} className={`log-card ${log.activity.toLowerCase()}`}>
                      {/* Activity Badge */}
                      <div className={`log-card-activity ${log.activity.toLowerCase()}`}>
                        {log.activity}
                      </div>

                      {/* Card Content */}
                      <div className="log-card-content">
                        {/* Left: Identity Block */}
                        <div className="log-card-identity">
                          <div className="log-card-name">{log.name}</div>
                          <div className="log-card-roll">{log.rollNumber}</div>
                          <span className={`type-badge ${log.type === 'Normal' ? 'normal' : log.type.startsWith('OS') ? 'outstation' : 'local'}`}>
                            {log.type}
                          </span>
                          <div className="log-card-contact">{log.contactNumber}</div>
                        </div>

                        {/* Middle: Place & Time */}
                        <div className="log-card-middle">
                          <div className="log-card-place-label">PLACE</div>
                          <div className="log-card-place">{log.place}</div>
                          <div className="log-card-time">{formatTime(log.timestamp)}</div>
                        </div>

                        {/* Right: Purpose */}
                        <div className="log-card-purpose">
                          <div className="log-card-purpose-label">PURPOSE</div>
                          <div className="log-card-purpose-text">{log.purpose}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // Placeholder for other pages
    return (
      <div className="admin-placeholder">
        Coming soon...
      </div>
    );
  };

  return (
    <div className="admin-layout">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-brand">
          <span className="admin-header-logo">GoThru</span>
          <span className="admin-header-subtitle">by Watchr</span>
        </div>
        <div className="admin-header-right">
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
          <div className="admin-avatar" title="Admin">
            <span className="admin-avatar-icon">👤</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="admin-body">
        {/* Sidebar */}
        <nav className="admin-sidebar">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
              title={item.label}
            >
              <span className="admin-nav-icon">{item.icon}</span>
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="admin-main">
          {/* Page Title */}
          <h2 className="admin-page-title">
            {activePage.toUpperCase()}
          </h2>

          {renderContent()}
        </main>
      </div>

      {/* Student List Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{modalTitle}</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              {modalLoading ? (
                <div className="admin-modal-loading">Loading...</div>
              ) : modalStudents.length === 0 ? (
                <div className="admin-modal-empty">No students found</div>
              ) : (
                <table className="admin-student-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Roll Number</th>
                      <th>Room</th>
                      <th>Hostel</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalStudents.map((student, idx) => (
                      <tr key={student._id || idx}>
                        <td>{student.name}</td>
                        <td>{student.rollnumber}</td>
                        <td>{student.roomNumber || '--'}</td>
                        <td>{student.hostelName || '--'}</td>
                        <td>{student.contactNumber || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
