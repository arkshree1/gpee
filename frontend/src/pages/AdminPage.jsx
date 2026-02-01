import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getAdminOverview,
  getStudentsInside,
  getStudentsOutside,
  getLocalGatepassExits,
  getOutstationGatepassExits,
  getDetailedLogs,
  getAllStudents,
  searchAdminStudents,
  getStudentLogsById,
  getAdminEntryExitLogs,
  searchGatepass,
  getImageUrl,
  searchStudentForBan,
  banStudent,
  unbanStudent,
  getBannedStudents
} from '../api/api';
import LiveActivityLogs from '../components/LiveActivityLogs';
import DonutChart from '../components/DonutChart';
import DonutChartMobile from '../components/DonutChartMobile';
import GuardEntryExitTable from '../components/GuardEntryExitTable';
import StudentIdCardPopup from '../components/StudentIdCardPopup';
import '../styles/admin.css';
import '../styles/student.css';
import '../styles/guard.css';

const AdminPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activePage, setActivePage] = useState(() => searchParams.get('page') || 'dashboard');

  // Persist activePage to URL
  useEffect(() => {
    setSearchParams({ page: activePage }, { replace: true });
  }, [activePage, setSearchParams]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student list modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalStudents, setModalStudents] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // ID Card popup state for modal students
  const [modalIdCardStudent, setModalIdCardStudent] = useState(null);
  const [showModalIdCard, setShowModalIdCard] = useState(false);

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
  const [logsFilter, setLogsFilter] = useState('all'); // 'all', 'normal', 'local', 'outstation'

  // Log Register page state (Guard-style logs)
  const [logRegisterLogs, setLogRegisterLogs] = useState([]);
  const [logRegisterLoading, setLogRegisterLoading] = useState(false);
  const [logRegisterDate, setLogRegisterDate] = useState(''); // Empty = show all dates
  const [logRegisterSearch, setLogRegisterSearch] = useState('');
  const [logRegisterFilter, setLogRegisterFilter] = useState(''); // Filter for late/outside students

  // Gatepass search page state
  const [gatepassType, setGatepassType] = useState('LOCAL');
  const [gatepassNumber, setGatepassNumber] = useState('');
  const [gatepassResult, setGatepassResult] = useState(null);
  const [gatepassLoading, setGatepassLoading] = useState(false);
  const [gatepassError, setGatepassError] = useState('');

  // Gatepass detail modal state (for clicking gatepass badges in logs)
  const [showGatepassModal, setShowGatepassModal] = useState(false);
  const [gatepassModalData, setGatepassModalData] = useState(null);
  const [gatepassModalLoading, setGatepassModalLoading] = useState(false);

  // Ban student page state
  const [banRollNumber, setBanRollNumber] = useState('');
  const [banSearchResult, setBanSearchResult] = useState(null);
  const [banSearchLoading, setBanSearchLoading] = useState(false);
  const [banSearchError, setBanSearchError] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banActionLoading, setBanActionLoading] = useState(false);
  const [bannedStudentsList, setBannedStudentsList] = useState([]);
  const [bannedListLoading, setBannedListLoading] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false);


  // Load recent searches from localStorage (limit to 5)
  useEffect(() => {
    const saved = localStorage.getItem('adminRecentSearches');
    if (saved) {
      const parsed = JSON.parse(saved).slice(0, 5);
      setRecentSearches(parsed);
    }
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

  const loadLogRegister = async (filter) => {
    setLogRegisterLoading(true);
    try {
      const res = await getAdminEntryExitLogs(filter || undefined);
      setLogRegisterLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load log register:', err);
    } finally {
      setLogRegisterLoading(false);
    }
  };

  const loadBannedStudents = async () => {
    setBannedListLoading(true);
    try {
      const res = await getBannedStudents();
      setBannedStudentsList(res.data.students || []);
    } catch (err) {
      console.error('Failed to load banned students:', err);
    } finally {
      setBannedListLoading(false);
    }
  };

  useEffect(() => {
    if (activePage === 'dashboard') {
      loadDashboard();
    } else if (activePage === 'students') {
      loadDetailedLogs();
    } else if (activePage === 'logregister') {
      loadLogRegister(logRegisterFilter);
    } else if (activePage === 'banstudent') {
      loadBannedStudents();
    }
  }, [activePage, logRegisterFilter]);

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

  // Format log time for guard-style table
  const formatLogTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;

    return `${hours}:${minutes} ${ampm}`;
  };

  // Filtered logs for Log Register page
  const filteredLogRegisterLogs = useMemo(() => {
    let base = logRegisterLogs;

    if (logRegisterDate) {
      const target = new Date(logRegisterDate);
      const targetY = target.getFullYear();
      const targetM = target.getMonth();
      const targetD = target.getDate();
      base = base.filter((l) => {
        if (!l.exitStatusTime) return false;
        const d = new Date(l.exitStatusTime);
        return (
          d.getFullYear() === targetY &&
          d.getMonth() === targetM &&
          d.getDate() === targetD
        );
      });
    }

    const trimmed = logRegisterSearch.trim();
    if (!trimmed) return base;
    const q = trimmed.toLowerCase();
    return base.filter((l) => {
      const s = l.student || {};
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.rollnumber && s.rollnumber.toLowerCase().includes(q))
      );
    });
  }, [logRegisterLogs, logRegisterSearch, logRegisterDate]);

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

  // Handle gatepass badge click (from Activity Logs)
  const handleGatepassClick = async (gatepassNo) => {
    if (!gatepassNo || gatepassNo === 'Normal') return;

    // Parse gatepass number - format is "L-00001" or "OS-00002"
    let type, number;
    if (gatepassNo.startsWith('OS-')) {
      type = 'OUTSTATION';
      number = gatepassNo.replace('OS-', '');
    } else if (gatepassNo.startsWith('L-')) {
      type = 'LOCAL';
      number = gatepassNo.replace('L-', '');
    } else {
      return; // Not a valid gatepass format
    }

    setGatepassModalLoading(true);
    setShowGatepassModal(true);
    setGatepassModalData(null);

    try {
      const res = await searchGatepass(type, number);
      setGatepassModalData(res.data);
    } catch (err) {
      console.error('Failed to fetch gatepass details:', err);
      setGatepassModalData({ error: err.response?.data?.message || 'Failed to load gatepass' });
    } finally {
      setGatepassModalLoading(false);
    }
  };

  // Calculate total students
  const totalStudents = (overview?.studentsInside || 0) + (overview?.studentsOutside || 0);

  // Sidebar navigation items
  const navItems = [
    { id: 'dashboard', icon: '▣', label: 'Dashboard' },
    { id: 'students', icon: '☰', label: 'Live Logs' },
    { id: 'logregister', icon: '▤', label: 'Log Register' },
    { id: 'searchstudent', icon: '⌕', label: 'Search' },
    { id: 'gatepasses', icon: '⎙', label: 'Gatepasses' },
    { id: 'banstudent', icon: '⊘', label: 'Ban Student' },
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
                    overview={overview}
                    onCardClick={handleCardClick}
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
              <LiveActivityLogs onStudentClick={handleStudentSelect} />
            </div>
          </div>

          {/* Live Activity Logs Panel (Desktop Only) */}
          <div className="desktop-only">
            <LiveActivityLogs onStudentClick={handleStudentSelect} />
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
                        <td>
                          <div
                            className="log-table-identity clickable"
                            onClick={() => log.studentId && handleStudentSelect({ _id: log.studentId, name: log.name, rollnumber: log.rollNumber, imageUrl: log.imageUrl })}
                            role="button"
                            tabIndex={0}
                          >
                            <img
                              src={getImageUrl(log.imageUrl) || '/default-avatar.png'}
                              alt=""
                              className="log-table-avatar"
                            />
                            <span>{log.name}</span>
                          </div>
                        </td>
                        <td>{log.rollNumber}</td>
                        <td>
                          <span className={`activity-badge ${log.activity.toLowerCase()}`}>
                            {log.activity}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`type-badge ${log.type === 'Normal' ? 'normal' : log.type.startsWith('OS') ? 'outstation' : 'local'} ${log.type !== 'Normal' ? 'clickable' : ''}`}
                            onClick={() => handleGatepassClick(log.type)}
                            role={log.type !== 'Normal' ? 'button' : undefined}
                            tabIndex={log.type !== 'Normal' ? 0 : undefined}
                          >
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
                        <div
                          className="log-card-identity clickable"
                          onClick={() => log.studentId && handleStudentSelect({ _id: log.studentId, name: log.name, rollnumber: log.rollNumber, imageUrl: log.imageUrl })}
                          role="button"
                          tabIndex={0}
                        >
                          <img
                            src={getImageUrl(log.imageUrl) || '/default-avatar.png'}
                            alt=""
                            className="log-card-avatar"
                          />
                          <div className="log-card-identity-info">
                            <div className="log-card-name">{log.name}</div>
                            <div className="log-card-roll">{log.rollNumber}</div>
                            <span
                              className={`type-badge ${log.type === 'Normal' ? 'normal' : log.type.startsWith('OS') ? 'outstation' : 'local'} ${log.type !== 'Normal' ? 'clickable' : ''}`}
                              onClick={(e) => { e.stopPropagation(); handleGatepassClick(log.type); }}
                              role={log.type !== 'Normal' ? 'button' : undefined}
                              tabIndex={log.type !== 'Normal' ? 0 : undefined}
                            >
                              {log.type}
                            </span>
                            <div className="log-card-contact">{log.contactNumber}</div>
                          </div>
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

    // Search Student page
    if (activePage === 'searchstudent') {
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
                <span>⌕</span> Search
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
                    <img
                      src={getImageUrl(student.imageUrl) || '/default-avatar.png'}
                      alt={student.name}
                      className="suggestion-avatar"
                    />
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
                    <img
                      src={getImageUrl(student.imageUrl) || '/default-avatar.png'}
                      alt={student.name}
                      className="suggestion-avatar"
                    />
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

    // Log Register Page (Guard-style logs)
    if (activePage === 'logregister') {
      return (
        <div className="guard-logs-page">
          <div className="guard-logs-header">
            <h2 className="guard-logs-title">Entry-Exit Log Register</h2>
            <div className="guard-logs-filters">
              <div className="guard-filter-group">
                <label>Date</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={logRegisterDate}
                    onChange={(e) => setLogRegisterDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="guard-date-input"
                  />
                  {logRegisterDate && (
                    <button
                      onClick={() => setLogRegisterDate('')}
                      className="admin-search-btn"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      title="Show all dates"
                    >
                      All
                    </button>
                  )}
                </div>
              </div>
              <div className="guard-filter-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Name or Roll No..."
                  value={logRegisterSearch}
                  onChange={(e) => setLogRegisterSearch(e.target.value)}
                  className="guard-search-input"
                />
              </div>
              <div className="guard-filter-group">
                <label>Filter</label>
                <select
                  value={logRegisterFilter}
                  onChange={(e) => setLogRegisterFilter(e.target.value)}
                  className="guard-date-input"
                  style={{ minWidth: '180px' }}
                >
                  <option value="">All Entries</option>
                  <option value="lateAfter8PM">🔴 Late After 8 PM</option>
                  <option value="outsideAfter8PM">⭐ Outside After 8 PM</option>
                  <option value="lateLocalGatepass">⚠️ Late (Local Gatepass)</option>
                  <option value="lateOutstationGatepass">⚠️ Late (Outstation Gatepass)</option>
                  <option value="outsidePastGatepass">🚨 Outside Past Gatepass Time</option>
                </select>
              </div>
            </div>
          </div>
          <GuardEntryExitTable
            logs={filteredLogRegisterLogs}
            loading={logRegisterLoading}
            formatLogTime={formatLogTime}
          />
        </div>
      );
    }

    // Gatepasses search page
    if (activePage === 'gatepasses') {
      const handleGatepassSearch = async (e) => {
        e?.preventDefault();
        if (!gatepassNumber.trim()) {
          setGatepassError('Please enter a gatepass number');
          return;
        }
        setGatepassLoading(true);
        setGatepassError('');
        setGatepassResult(null);
        try {
          const res = await searchGatepass(gatepassType, gatepassNumber.trim());
          setGatepassResult(res.data);
        } catch (err) {
          setGatepassError(err.response?.data?.message || 'Failed to find gatepass');
        } finally {
          setGatepassLoading(false);
        }
      };

      const formatDateTime = (date) => {
        if (!date) return '--';
        const d = new Date(date);
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

      const formatTimeTo12hr = (timeStr) => {
        if (!timeStr) return '--';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${suffix}`;
      };

      return (
        <div className="gatepasses-page">
          {/* Search Bar */}
          <div className="gp-search-bar">
            <select
              value={gatepassType}
              onChange={(e) => setGatepassType(e.target.value)}
              className="gp-select"
            >
              <option value="LOCAL">Local</option>
              <option value="OUTSTATION">Outstation</option>
            </select>
            <input
              type="text"
              className="gp-input"
              placeholder="Enter number (e.g. 00001)"
              value={gatepassNumber}
              onChange={(e) => setGatepassNumber(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleGatepassSearch(e)}
            />
            <button className="gp-search-btn" onClick={handleGatepassSearch} disabled={gatepassLoading}>
              {gatepassLoading ? '...' : 'Search'}
            </button>
          </div>

          {gatepassError && <div className="gp-error">{gatepassError}</div>}

          {/* Gatepass Result - Compact Layout */}
          {gatepassResult && (
            <div className="gp-result">
              {/* Header with badge */}
              <div className="gp-result-header">
                <span className="gp-type-badge">{gatepassResult.type === 'LOCAL' ? 'LOCAL' : 'OUTSTATION'}</span>
                <span className="gp-number">{gatepassResult.gatePassNo}</span>
                <span className={`gp-status ${gatepassResult.gatepassDetails.status || gatepassResult.gatepassDetails.finalStatus}`}>
                  {gatepassResult.gatepassDetails.status || gatepassResult.gatepassDetails.finalStatus || '--'}
                </span>
              </div>

              {/* Main Content - Two Columns */}
              <div className="gp-content">
                {/* Left: Student Info */}
                <div className="gp-student">
                  <img
                    src={getImageUrl(gatepassResult.student.imageUrl) || '/default-avatar.png'}
                    alt=""
                    className="gp-photo"
                  />
                  <div className="gp-student-info">
                    <h4>{gatepassResult.student.name}</h4>
                    <span className="gp-roll">{gatepassResult.student.rollnumber}</span>
                    <div className="gp-mini-grid">
                      <div><label>Branch</label><span>{gatepassResult.student.branch || '--'}</span></div>
                      <div><label>Dept</label><span>{gatepassResult.student.department || '--'}</span></div>
                      <div><label>Contact</label><span>{gatepassResult.student.contactNumber || '--'}</span></div>
                      <div><label>Hostel</label><span>{gatepassResult.student.hostelName || '--'} {gatepassResult.student.roomNumber || ''}</span></div>
                    </div>
                  </div>
                </div>

                {/* Right: Details & Timeline */}
                <div className="gp-details">
                  {/* Gatepass Info */}
                  <div className="gp-info-row">
                    {gatepassResult.type === 'LOCAL' ? (
                      <>
                        <div><label>Purpose</label><span>{gatepassResult.gatepassDetails.purpose || '--'}</span></div>
                        <div><label>Place</label><span>{gatepassResult.gatepassDetails.place || '--'}</span></div>
                      </>
                    ) : (
                      <>
                        <div><label>Nature</label><span>{gatepassResult.gatepassDetails.natureOfLeave || '--'}</span></div>
                        <div><label>Reason</label><span>{gatepassResult.gatepassDetails.reasonOfLeave || '--'}</span></div>
                        <div><label>Address</label><span>{gatepassResult.gatepassDetails.address || '--'}</span></div>
                        <div><label>Days</label><span>{gatepassResult.gatepassDetails.leaveDays || '--'}</span></div>
                      </>
                    )}
                    <div><label>Utilization</label><span className={`gp-util-badge ${gatepassResult.gatepassDetails.utilizationStatus}`}>{gatepassResult.gatepassDetails.utilizationStatus || '--'}</span></div>
                  </div>

                  {/* Timeline - Horizontal */}
                  <div className="gp-timeline">
                    <div className="gp-time-item">
                      <span className="gp-time-label">Applied</span>
                      <span className="gp-time-value">{formatDateTime(gatepassResult.gatepassDetails.appliedAt)}</span>
                    </div>
                    <div className="gp-time-item">
                      <span className="gp-time-label">Approved</span>
                      <span className="gp-time-value">{formatDateTime(gatepassResult.gatepassDetails.approvedAt)}</span>
                    </div>
                    <div className="gp-time-item">
                      <span className="gp-time-label">Planned Out</span>
                      <span className="gp-time-value">{gatepassResult.gatepassDetails.plannedDateOut} {formatTimeTo12hr(gatepassResult.gatepassDetails.plannedTimeOut)}</span>
                    </div>
                    <div className="gp-time-item">
                      <span className="gp-time-label">Actual Exit</span>
                      <span className="gp-time-value">{formatDateTime(gatepassResult.gatepassDetails.actualExitAt)}</span>
                    </div>
                    <div className="gp-time-item">
                      <span className="gp-time-label">Planned In</span>
                      <span className="gp-time-value">{gatepassResult.gatepassDetails.plannedDateIn} {formatTimeTo12hr(gatepassResult.gatepassDetails.plannedTimeIn)}</span>
                    </div>
                    <div className="gp-time-item">
                      <span className="gp-time-label">Actual Entry</span>
                      <span className="gp-time-value">{formatDateTime(gatepassResult.gatepassDetails.actualEntryAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Ban Student Management Page
    if (activePage === 'banstudent') {
      const handleBanSearch = async (e) => {
        e?.preventDefault();
        if (!banRollNumber.trim()) {
          setBanSearchError('Please enter a roll number');
          return;
        }
        setBanSearchLoading(true);
        setBanSearchError('');
        setBanSearchResult(null);
        setBanReason('');
        try {
          const res = await searchStudentForBan(banRollNumber.trim());
          setBanSearchResult(res.data.student);
        } catch (err) {
          setBanSearchError(err.response?.data?.message || 'Student not found');
        } finally {
          setBanSearchLoading(false);
        }
      };

      const handleBanStudent = async () => {
        if (!banReason.trim()) {
          setBanSearchError('Please provide a reason for banning');
          return;
        }
        setBanActionLoading(true);
        setBanSearchError('');
        try {
          await banStudent(banSearchResult._id, banReason.trim());
          // Refresh the search result
          const res = await searchStudentForBan(banRollNumber.trim());
          setBanSearchResult(res.data.student);
          setBanReason('');
          setShowBanConfirm(false);
          // Refresh banned list
          loadBannedStudents();
        } catch (err) {
          setBanSearchError(err.response?.data?.message || 'Failed to ban student');
        } finally {
          setBanActionLoading(false);
        }
      };

      const handleUnbanStudent = async () => {
        setBanActionLoading(true);
        setBanSearchError('');
        try {
          await unbanStudent(banSearchResult._id);
          // Refresh the search result
          const res = await searchStudentForBan(banRollNumber.trim());
          setBanSearchResult(res.data.student);
          setShowUnbanConfirm(false);
          // Refresh banned list
          loadBannedStudents();
        } catch (err) {
          setBanSearchError(err.response?.data?.message || 'Failed to unban student');
        } finally {
          setBanActionLoading(false);
        }
      };

      const formatBanDate = (date) => {
        if (!date) return '--';
        return new Date(date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      return (
        <div className="ban-student-page">
          {/* Warning Banner */}
          <div className="ban-warning-banner">
            <span className="ban-warning-icon">⚠️</span>
            <span>This is a sensitive operation. Banned students cannot apply for any gatepasses or generate exit QR codes.</span>
          </div>

          {/* Search Section */}
          <div className="ban-search-section">
            <h3 className="ban-section-title">Search Student by Roll Number</h3>
            <div className="ban-search-box">
              <input
                type="text"
                className="ban-search-input"
                placeholder="Enter exact roll number (e.g., 21MS1001)"
                value={banRollNumber}
                onChange={(e) => setBanRollNumber(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleBanSearch(e)}
              />
              <button 
                className="ban-search-btn" 
                onClick={handleBanSearch} 
                disabled={banSearchLoading}
              >
                {banSearchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {banSearchError && <div className="ban-error">{banSearchError}</div>}
          </div>

          {/* Search Result - Student Card */}
          {banSearchResult && (
            <div className={`ban-student-card ${banSearchResult.isBanned ? 'is-banned' : ''}`}>
              <div className="ban-card-header">
                <img
                  src={getImageUrl(banSearchResult.imageUrl) || '/default-avatar.png'}
                  alt={banSearchResult.name}
                  className="ban-student-photo"
                />
                <div className="ban-student-basic">
                  <h4 className="ban-student-name">{banSearchResult.name}</h4>
                  <span className="ban-student-roll">{banSearchResult.rollnumber}</span>
                  <span className={`ban-status-badge ${banSearchResult.isBanned ? 'banned' : 'active'}`}>
                    {banSearchResult.isBanned ? '🚫 BANNED' : '✓ ACTIVE'}
                  </span>
                </div>
              </div>

              <div className="ban-card-details">
                <div className="ban-detail-row">
                  <label>Email</label>
                  <span>{banSearchResult.email}</span>
                </div>
                <div className="ban-detail-row">
                  <label>Department</label>
                  <span>{banSearchResult.department || '--'}</span>
                </div>
                <div className="ban-detail-row">
                  <label>Branch</label>
                  <span>{banSearchResult.branch || '--'}</span>
                </div>
                <div className="ban-detail-row">
                  <label>Course</label>
                  <span>{banSearchResult.course || '--'}</span>
                </div>
                <div className="ban-detail-row">
                  <label>Hostel</label>
                  <span>{banSearchResult.hostelName || '--'} {banSearchResult.roomNumber || ''}</span>
                </div>
                <div className="ban-detail-row">
                  <label>Current Status</label>
                  <span className={`presence-badge ${banSearchResult.presence}`}>
                    {banSearchResult.presence === 'inside' ? 'Inside Campus' : 'Outside Campus'}
                  </span>
                </div>
              </div>

              {/* Ban Info Section (if banned) */}
              {banSearchResult.isBanned && (
                <div className="ban-info-section">
                  <div className="ban-info-header">Ban Details</div>
                  <div className="ban-detail-row">
                    <label>Reason</label>
                    <span className="ban-reason-text">{banSearchResult.banReason || 'Not specified'}</span>
                  </div>
                  <div className="ban-detail-row">
                    <label>Banned On</label>
                    <span>{formatBanDate(banSearchResult.bannedAt)}</span>
                  </div>
                </div>
              )}

              {/* Action Section */}
              <div className="ban-action-section">
                {!banSearchResult.isBanned ? (
                  <>
                    {!showBanConfirm ? (
                      <button 
                        className="ban-action-btn ban-btn"
                        onClick={() => setShowBanConfirm(true)}
                      >
                        🚫 Ban Student
                      </button>
                    ) : (
                      <div className="ban-confirm-section">
                        <label className="ban-reason-label">Reason for Ban (required):</label>
                        <textarea
                          className="ban-reason-input"
                          placeholder="Enter the reason for banning this student..."
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          rows={3}
                        />
                        <div className="ban-confirm-buttons">
                          <button 
                            className="ban-confirm-btn confirm"
                            onClick={handleBanStudent}
                            disabled={banActionLoading || !banReason.trim()}
                          >
                            {banActionLoading ? 'Processing...' : 'Confirm Ban'}
                          </button>
                          <button 
                            className="ban-confirm-btn cancel"
                            onClick={() => { setShowBanConfirm(false); setBanReason(''); }}
                            disabled={banActionLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {!showUnbanConfirm ? (
                      <button 
                        className="ban-action-btn unban-btn"
                        onClick={() => setShowUnbanConfirm(true)}
                      >
                        ✓ Unban Student
                      </button>
                    ) : (
                      <div className="ban-confirm-section">
                        <p className="unban-confirm-text">
                          Are you sure you want to unban <strong>{banSearchResult.name}</strong>? 
                          They will be able to apply for gatepasses again.
                        </p>
                        <div className="ban-confirm-buttons">
                          <button 
                            className="ban-confirm-btn confirm unban"
                            onClick={handleUnbanStudent}
                            disabled={banActionLoading}
                          >
                            {banActionLoading ? 'Processing...' : 'Confirm Unban'}
                          </button>
                          <button 
                            className="ban-confirm-btn cancel"
                            onClick={() => setShowUnbanConfirm(false)}
                            disabled={banActionLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Banned Students List */}
          <div className="banned-list-section">
            <h3 className="ban-section-title">
              Currently Banned Students 
              <span className="banned-count">({bannedStudentsList.length})</span>
            </h3>
            
            {bannedListLoading ? (
              <div className="banned-list-loading">Loading...</div>
            ) : bannedStudentsList.length === 0 ? (
              <div className="banned-list-empty">No students are currently banned.</div>
            ) : (
              <div className="banned-list">
                {bannedStudentsList.map((student) => (
                  <div 
                    key={student._id} 
                    className="banned-list-item"
                    onClick={() => {
                      setBanRollNumber(student.rollnumber);
                      setBanSearchResult(student);
                      setShowBanConfirm(false);
                      setShowUnbanConfirm(false);
                    }}
                  >
                    <img
                      src={getImageUrl(student.imageUrl) || '/default-avatar.png'}
                      alt={student.name}
                      className="banned-item-photo"
                    />
                    <div className="banned-item-info">
                      <span className="banned-item-name">{student.name}</span>
                      <span className="banned-item-roll">{student.rollnumber}</span>
                    </div>
                    <div className="banned-item-reason" title={student.banReason}>
                      {student.banReason || 'No reason'}
                    </div>
                    <div className="banned-item-date">
                      {formatBanDate(student.bannedAt)}
                    </div>
                  </div>
                ))}
              </div>
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
            <span className="sidebar-toggle-icon">{sidebarOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : '☰'}</span>
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
                <div className="admin-modal-loading">
                  <div className="loader" role="status" aria-label="Loading"></div>
                </div>
              ) : modalStudents.length === 0 ? (
                <div className="admin-modal-empty">No students found</div>
              ) : (
                <table className="admin-student-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Name</th>
                      <th>Roll Number</th>
                      <th>Email</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalStudents.map((student, idx) => (
                      <tr key={student._id || idx}>
                        <td>
                          <div 
                            className="profile-pic-hover profile-pic-clickable"
                            style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer' }}
                            onClick={() => { setModalIdCardStudent(student); setShowModalIdCard(true); }}
                            title="Click to view ID Card"
                          >
                            {student.imageUrl ? (
                              <img 
                                src={getImageUrl(student.imageUrl)} 
                                alt={student.name} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', color: '#666' }}>
                                {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                              </div>
                            )}
                          </div>
                        </td>
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
            
            {/* ID Card Popup for modal students */}
            <StudentIdCardPopup 
              student={modalIdCardStudent} 
              isOpen={showModalIdCard} 
              onClose={() => setShowModalIdCard(false)} 
            />
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
                    <div className="id-card-logo-text">GoThru x RGIPT</div>
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
                        <img src={getImageUrl(selectedStudent.imageUrl)} alt={selectedStudent.name} className="id-card-photo" />
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
                      <span className="id-card-value">{selectedStudent.branch || '--'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entry-Exit Logs */}
              <div className="student-logs-section">
                <div className="student-logs-header">
                  <h4 className="student-logs-title">Entry-Exit History</h4>
                  <select
                    className="student-logs-filter"
                    value={logsFilter}
                    onChange={(e) => setLogsFilter(e.target.value)}
                  >
                    <option value="all">all entries →</option>
                    <option value="normal">normal only</option>
                    <option value="local">local gatepass</option>
                    <option value="outstation">outstation gatepass</option>
                  </select>
                </div>
                <div className="student-logs-container">
                  {studentLogsLoading ? (
                    <div className="admin-modal-loading">Loading logs...</div>
                  ) : studentLogs.filter((log) => {
                    if (logsFilter === 'all') return true;
                    if (logsFilter === 'normal') return log.type === 'Normal';
                    if (logsFilter === 'local') return log.type === 'Local GP';
                    if (logsFilter === 'outstation') return log.type === 'Outstation GP';
                    return true;
                  }).length === 0 ? (
                    <div className="admin-modal-empty">No entry-exit logs found</div>
                  ) : (
                    studentLogs.filter((log) => {
                      if (logsFilter === 'all') return true;
                      if (logsFilter === 'normal') return log.type === 'Normal';
                      if (logsFilter === 'local') return log.type === 'Local GP';
                      if (logsFilter === 'outstation') return log.type === 'Outstation GP';
                      return true;
                    }).map((log) => (
                      <div key={log.id} className={`student-log-card ${log.direction.toLowerCase()}`}>
                        <div className={`log-direction-badge ${log.direction.toLowerCase()}`}>
                          {log.direction}
                        </div>
                        <div className="log-card-details">
                          <div className="log-detail-block">
                            <span className="log-type-badge">{log.gatePassNo || log.type}</span>
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

      {/* Gatepass Detail Modal */}
      {showGatepassModal && (
        <div className="admin-modal-overlay" onClick={() => setShowGatepassModal(false)}>
          <div className="admin-modal gatepass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <span className="admin-modal-title">Gatepass Details</span>
              <button className="admin-modal-close" onClick={() => setShowGatepassModal(false)}>×</button>
            </div>
            <div className="admin-modal-body" style={{ padding: '20px' }}>
              {gatepassModalLoading && (
                <div className="admin-modal-loading">Loading gatepass details...</div>
              )}
              {!gatepassModalLoading && gatepassModalData?.error && (
                <div className="gp-error">{gatepassModalData.error}</div>
              )}
              {!gatepassModalLoading && gatepassModalData && !gatepassModalData.error && (
                <div className="gp-result" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                  {/* Header with badge */}
                  <div className="gp-result-header">
                    <span className="gp-type-badge">{gatepassModalData.type === 'LOCAL' ? 'LOCAL' : 'OUTSTATION'}</span>
                    <span className="gp-number">{gatepassModalData.gatePassNo}</span>
                    <span className={`gp-status ${gatepassModalData.gatepassDetails.status || gatepassModalData.gatepassDetails.finalStatus}`}>
                      {gatepassModalData.gatepassDetails.status || gatepassModalData.gatepassDetails.finalStatus || '--'}
                    </span>
                  </div>

                  {/* Main Content - Two Columns */}
                  <div className="gp-content">
                    {/* Left: Student Info */}
                    <div className="gp-student">
                      <img
                        src={getImageUrl(gatepassModalData.student.imageUrl) || '/default-avatar.png'}
                        alt=""
                        className="gp-photo"
                      />
                      <div className="gp-student-info">
                        <h4>{gatepassModalData.student.name}</h4>
                        <span className="gp-roll">{gatepassModalData.student.rollnumber}</span>
                        <div className="gp-mini-grid">
                          <div><label>Branch</label><span>{gatepassModalData.student.branch || '--'}</span></div>
                          <div><label>Dept</label><span>{gatepassModalData.student.department || '--'}</span></div>
                          <div><label>Contact</label><span>{gatepassModalData.student.contactNumber || '--'}</span></div>
                          <div><label>Hostel</label><span>{gatepassModalData.student.hostelName || '--'} {gatepassModalData.student.roomNumber || ''}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Details & Timeline */}
                    <div className="gp-details">
                      {/* Gatepass Info */}
                      <div className="gp-info-row">
                        {gatepassModalData.type === 'LOCAL' ? (
                          <>
                            <div><label>Purpose</label><span>{gatepassModalData.gatepassDetails.purpose || '--'}</span></div>
                            <div><label>Place</label><span>{gatepassModalData.gatepassDetails.place || '--'}</span></div>
                          </>
                        ) : (
                          <>
                            <div><label>Nature</label><span>{gatepassModalData.gatepassDetails.natureOfLeave || '--'}</span></div>
                            <div><label>Reason</label><span>{gatepassModalData.gatepassDetails.reasonOfLeave || '--'}</span></div>
                            <div><label>Address</label><span>{gatepassModalData.gatepassDetails.address || '--'}</span></div>
                            <div><label>Days</label><span>{gatepassModalData.gatepassDetails.leaveDays || '--'}</span></div>
                          </>
                        )}
                        <div><label>Utilization</label><span className={`gp-util-badge ${gatepassModalData.gatepassDetails.utilizationStatus}`}>{gatepassModalData.gatepassDetails.utilizationStatus || '--'}</span></div>
                      </div>

                      {/* Timeline - Horizontal */}
                      <div className="gp-timeline">
                        <div className="gp-time-item">
                          <span className="gp-time-label">Applied</span>
                          <span className="gp-time-value">{formatTime(gatepassModalData.gatepassDetails.appliedAt)}</span>
                        </div>
                        <div className="gp-time-item">
                          <span className="gp-time-label">Approved</span>
                          <span className="gp-time-value">{formatTime(gatepassModalData.gatepassDetails.approvedAt)}</span>
                        </div>
                        <div className="gp-time-item">
                          <span className="gp-time-label">Planned Out</span>
                          <span className="gp-time-value">{gatepassModalData.gatepassDetails.plannedDateOut || '--'}</span>
                        </div>
                        <div className="gp-time-item">
                          <span className="gp-time-label">Actual Exit</span>
                          <span className="gp-time-value">{formatTime(gatepassModalData.gatepassDetails.actualExitAt)}</span>
                        </div>
                        <div className="gp-time-item">
                          <span className="gp-time-label">Planned In</span>
                          <span className="gp-time-value">{gatepassModalData.gatepassDetails.plannedDateIn || '--'}</span>
                        </div>
                        <div className="gp-time-item">
                          <span className="gp-time-label">Actual Entry</span>
                          <span className="gp-time-value">{formatTime(gatepassModalData.gatepassDetails.actualEntryAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
