import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminOverview,
  getStudentsInside,
  getStudentsOutside,
  getLocalGatepassExits,
  getOutstationGatepassExits,
  getDetailedLogs,
  getAllStudents,
  searchAdminStudents,
  getStudentLogsById
} from '../api/api';
import LiveActivityLogs from '../components/LiveActivityLogs';
import DonutChart from '../components/DonutChart';
import DonutChartMobile from '../components/DonutChartMobile';
import '../styles/admin.css';
import '../styles/student.css';

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

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Student search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Student detail popup state
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLogs, setStudentLogs] = useState([]);
  const [studentLogsLoading, setStudentLogsLoading] = useState(false);

  // Mobile detection for responsive component rendering
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminRecentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Listen for window resize to update isMobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle nav item click (close sidebar on mobile after selection)
  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setSidebarOpen(false); // Close sidebar on mobile
  };

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

  // Add admin-page-active class to prevent scrolling on admin pages only
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

  // Handle stat card clicks
  const handleCardClick = async (type) => {
    setModalLoading(true);
    setShowModal(true);

    try {
      let res;
      switch (type) {
        case 'total':
          setModalTitle('All Students');
          res = await getAllStudents();
          break;
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

  // Debounced search handler
  const handleSearchChange = useCallback(async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);

    if (value.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await searchAdminStudents(value);
      setSearchResults(res.data.students || []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle student selection from suggestions
  const handleStudentSelect = async (student) => {
    setShowSuggestions(false);
    setSearchQuery('');
    setSearchResults([]);

    // Add to recent searches
    const updatedRecent = [student, ...recentSearches.filter(s => s._id !== student._id)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('adminRecentSearches', JSON.stringify(updatedRecent));

    // Load student details and logs
    setSelectedStudent(student);
    setShowStudentDetail(true);
    setStudentLogsLoading(true);

    try {
      const res = await getStudentLogsById(student._id);
      setStudentLogs(res.data.logs || []);
      // Update student with full details
      if (res.data.student) {
        setSelectedStudent(res.data.student);
      }
    } catch (err) {
      console.error('Failed to load student logs:', err);
      setStudentLogs([]);
    } finally {
      setStudentLogsLoading(false);
    }
  };

  // Handle search button click
  const handleSearchSubmit = () => {
    if (searchResults.length > 0) {
      handleStudentSelect(searchResults[0]);
    }
  };

  // Calculate total students
  const totalStudents = (overview?.studentsInside || 0) + (overview?.studentsOutside || 0);

  // Sidebar navigation items
  const navItems = [
    { id: 'dashboard', icon: '◫', label: 'Dashboard' },
    { id: 'students', icon: '◑', label: 'Logs' },
    { id: 'gatepasses', icon: '▤', label: 'Search' },
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

            {/* Dashboard Main Section: Donut + Metrics */}
            <div className="admin-dashboard-main">
              {/* Left: Donut Chart Container */}
              <div className="admin-donut-container">
                {/* Desktop: Full DonutChart with radial labels */}
                <div className="desktop-only">
                  <DonutChart
                    size={240}
                    strokeWidth={32}
                    totalStudents={totalStudents}
                    data={[
                      {
                        value: overview?.studentsInside || 0,
                        color: '#34B1AA',
                        label: 'Students Inside Campus'
                      },
                      {
                        value: overview?.normalExits || 0,
                        color: '#F29F67',
                        label: 'Students Outside (Normal)'
                      },
                      {
                        value: overview?.localGatepassExits || 0,
                        color: '#3B8FF3',
                        label: 'Students Outside (Local Gatepass)'
                      },
                      {
                        value: overview?.outstationGatepassExits || 0,
                        color: '#1E1E2C',
                        label: 'Students Outside (Outstation Gatepass)'
                      }
                    ]}
                  />
                </div>
                {/* Mobile: Compact DonutChartMobile with legend below */}
                <div className="mobile-only">
                  <DonutChartMobile
                    totalStudents={totalStudents}
                    data={[
                      {
                        value: overview?.studentsInside || 0,
                        color: '#34B1AA',
                        label: 'Students Inside Campus'
                      },
                      {
                        value: overview?.normalExits || 0,
                        color: '#F29F67',
                        label: 'Students Outside (Normal)'
                      },
                      {
                        value: overview?.localGatepassExits || 0,
                        color: '#3B8FF3',
                        label: 'Students Outside (Local Gatepass)'
                      },
                      {
                        value: overview?.outstationGatepassExits || 0,
                        color: '#1E1E2C',
                        label: 'Students Outside (Outstation Gatepass)'
                      }
                    ]}
                  />
                </div>
              </div>

              {/* Right: Metrics Panel - Vertical Stack (Desktop Only) */}
              <div className="admin-metrics-panel desktop-only">
                {/* Total Students */}
                <div className="admin-metric-card clickable" style={{ borderLeft: '4px solid #6366f1' }} onClick={() => handleCardClick('total')}>
                  <div className="admin-metric-title">TOTAL STUDENTS</div>
                  <div className="admin-metric-value" style={{ color: '#6366f1' }}>{totalStudents}</div>
                </div>

                {/* Students In Campus */}
                <div className="admin-metric-card clickable" style={{ borderLeft: '4px solid #34B1AA' }} onClick={() => handleCardClick('inside')}>
                  <div className="admin-metric-title">STUDENTS IN CAMPUS</div>
                  <div className="admin-metric-value" style={{ color: '#34B1AA' }}>{overview?.studentsInside || 0}</div>
                </div>

                {/* Students Outside - Normal */}
                <div className="admin-metric-card clickable" style={{ borderLeft: '4px solid #F29F67' }} onClick={() => handleCardClick('outside')}>
                  <div className="admin-metric-title">STUDENTS OUTSIDE – NORMAL EXIT</div>
                  <div className="admin-metric-value" style={{ color: '#F29F67' }}>{overview?.normalExits || 0}</div>
                </div>

                {/* Students Outside - Local GP */}
                <div className="admin-metric-card clickable" style={{ borderLeft: '4px solid #3B8FF3' }} onClick={() => handleCardClick('local')}>
                  <div className="admin-metric-title">STUDENT OUT ON LOCAL GATEPASS</div>
                  <div className="admin-metric-value" style={{ color: '#3B8FF3' }}>{overview?.localGatepassExits || 0}</div>
                </div>

                {/* Students Outside - OS GP */}
                <div className="admin-metric-card clickable" style={{ borderLeft: '4px solid #1E1E2C' }} onClick={() => handleCardClick('outstation')}>
                  <div className="admin-metric-title">STUDENT OUT ON OUTSTATION GATEPASS</div>
                  <div className="admin-metric-value" style={{ color: '#1E1E2C' }}>{overview?.outstationGatepassExits || 0}</div>
                </div>
              </div>
            </div>

            {/* Mobile-only: Scrollable Live Activity Log */}
            <div className="mobile-live-activity-container mobile-only">
              <LiveActivityLogs />
            </div>
          </div>

          {/* Live Activity Logs Panel (Desktop Only) */}
          <div className="desktop-only">
            <LiveActivityLogs />
          </div>
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

    // Gatepasses page - Student Search
    if (activePage === 'gatepasses') {
      return (
        <div className="admin-search-page">
          {/* Search Input Section */}
          <div className="admin-search-section">
            <h3 className="admin-search-title">Search Student</h3>
            <div className="admin-search-box">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
              />
              <button className="admin-search-btn" onClick={() => handleSearchSubmit()}>
                <span>🔍</span> Search
              </button>
            </div>

            {/* Suggestions Dropdown - appears on focus when typing */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="admin-suggestions-dropdown">
                {searchLoading && <div className="admin-suggestion-loading">Searching...</div>}
                {searchResults.map((student) => (
                  <div
                    key={student._id}
                    className="admin-suggestion-item"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <span className="suggestion-name">{student.name}</span>
                    <span className="suggestion-roll">{student.rollnumber}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Searches - Always visible below search box */}
          {searchQuery === '' && recentSearches.length > 0 && (
            <div className="admin-recent-searches">
              <div className="recent-searches-header">Recent Searches</div>
              <div className="recent-searches-list">
                {recentSearches.map((student) => (
                  <div
                    key={student._id}
                    className="recent-search-item"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <span className="suggestion-name">{student.name}</span>
                    <span className="suggestion-roll">{student.rollnumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Click outside to close suggestions */}
          {showSuggestions && searchResults.length > 0 && (
            <div className="admin-suggestions-backdrop" onClick={() => setShowSuggestions(false)} />
          )}
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
        {/* Mobile Hamburger Button */}
        <button
          className="admin-menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

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
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="admin-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <nav className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {/* Mobile Sidebar Toggle - FIRST ITEM (visible only on mobile) */}
          <button
            className="admin-sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <span className="sidebar-toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>
            <span className="sidebar-toggle-label">{sidebarOpen ? 'Close' : 'Menu'}</span>
          </button>

          {/* Sidebar Brand Header */}
          <div className="admin-sidebar-brand">
            <span className="admin-sidebar-brand-icon">◈</span>
            <span className="admin-sidebar-brand-text">GoThru</span>
          </div>

          {/* Navigation Items */}
          <div className="admin-sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`admin-nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span className="admin-nav-label">{item.label}</span>
              </button>
            ))}
          </div>
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
                      <th>Email</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalStudents.map((student, idx) => (
                      <tr key={student._id || idx}>
                        <td>{student.name}</td>
                        <td>{student.rollnumber}</td>
                        <td>{student.email || '--'}</td>
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

      {/* Student Detail Popup */}
      {showStudentDetail && selectedStudent && (
        <div className="admin-modal-overlay student-detail-overlay" onClick={() => setShowStudentDetail(false)}>
          <div className="admin-student-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="student-detail-close" onClick={() => setShowStudentDetail(false)}>×</button>

            <div className="student-detail-content">
              {/* Student ID Card - using same structure as StudentProfile */}
              <div className="id-card admin-id-card">
                {/* Header Section with College Name */}
                <div className="id-card-header">
                  <div className="id-card-logo-section">
                    <img src="/rgipt-logo.png" alt="RGIPT Logo" className="id-card-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                    <div className="id-card-logo-text">RGIPT X GoThru</div>
                  </div>
                  <div className="id-card-college-info">
                    <div className="id-card-college-name-en">RAJIV GANDHI INSTITUTE OF PETROLEUM TECHNOLOGY</div>
                    <div className="id-card-college-subtitle">(An Institute of National Importance Established Under an Act of Parliament)</div>
                  </div>
                </div>

                {/* Tricolor Line */}
                <div className="id-card-tricolor">
                  <div className="tricolor-saffron"></div>
                  <div className="tricolor-white"></div>
                  <div className="tricolor-green"></div>
                </div>

                {/* Card Title */}
                <div className="id-card-title">Student GoThru Pass Card</div>

                {/* Main Content */}
                <div className="id-card-body">
                  <div className="id-card-photo-section">
                    <div className="id-card-photo-frame">
                      {selectedStudent.imageUrl ? (
                        <img src={selectedStudent.imageUrl.startsWith('http') ? selectedStudent.imageUrl : `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}${selectedStudent.imageUrl}`} alt={selectedStudent.name} className="id-card-photo" />
                      ) : (
                        <div className="id-card-photo-placeholder"><span>📷</span></div>
                      )}
                    </div>
                  </div>

                  <div className="id-card-details">
                    <div className="id-card-row">
                      <span className="id-card-label">Name</span>
                      <span className="id-card-colon">:</span>
                      <span className="id-card-value">{selectedStudent.name}</span>
                    </div>
                    <div className="id-card-row">
                      <span className="id-card-label">Room & Hostel</span>
                      <span className="id-card-colon">:</span>
                      <span className="id-card-value">{selectedStudent.roomNumber || '--'}, {selectedStudent.hostelName || '--'}</span>
                    </div>
                    <div className="id-card-row">
                      <span className="id-card-label">Contact No.</span>
                      <span className="id-card-colon">:</span>
                      <span className="id-card-value">{selectedStudent.contactNumber || '--'}</span>
                    </div>
                    <div className="id-card-row">
                      <span className="id-card-label">Roll No.</span>
                      <span className="id-card-colon">:</span>
                      <span className="id-card-value">{selectedStudent.rollnumber?.toUpperCase()}</span>
                    </div>
                    <div className="id-card-row">
                      <span className="id-card-label">Branch</span>
                      <span className="id-card-colon">:</span>
                      <span className="id-card-value">{selectedStudent.department || selectedStudent.branch || '--'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entry-Exit Logs */}
              <div className="student-logs-section">
                <h4 className="student-logs-title">Entry-Exit History</h4>
                <div className="student-logs-container">
                  {studentLogsLoading ? (
                    <div className="admin-modal-loading">Loading logs...</div>
                  ) : studentLogs.length === 0 ? (
                    <div className="admin-modal-empty">No entry-exit logs found</div>
                  ) : (
                    studentLogs.map((log) => (
                      <div key={log.id} className={`student-log-card ${log.direction.toLowerCase()}`}>
                        <div className={`log-direction-badge ${log.direction.toLowerCase()}`}>
                          {log.direction}
                        </div>
                        <div className="log-card-details">
                          <div className="log-detail-block">
                            <span className="log-type-badge">{log.type}</span>
                            <span className="log-time">{formatTime(log.timestamp)}</span>
                          </div>
                          <div className="log-detail-block">
                            <div className="log-info">
                              <span className="log-label">PLACE</span>
                              <span className="log-value">{log.place}</span>
                            </div>
                            <div className="log-info">
                              <span className="log-label">PURPOSE</span>
                              <span className="log-value">{log.purpose}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
