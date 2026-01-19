import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentStatus, getStudentLogs } from '../api/api';
import '../styles/student-dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const StudentHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showGpHelp, setShowGpHelp] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const actionLabel = useMemo(() => {
    if (!status) return '...';
    return status.nextAction === 'exit' ? 'Apply for Exit' : 'Apply for Entry';
  }, [status]);

  const refresh = async () => {
    setError('');
    try {
      const res = await getStudentStatus();
      setStatus(res.data);
      const logsRes = await getStudentLogs();
      setLogs(logsRes.data.logs || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleApply = () => {
    if (!status) return;
    if (status.hasPendingRequest) return;
    navigate('/student/apply');
  };

  const parseDate = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  const formatTime = (d) => {
    if (!d) return '--';
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatDate = (d) => {
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatShortDate = (d) => {
    if (!d) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    return `${day} ${month}`;
  };

  const formatCurrentDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return currentTime.toLocaleDateString('en-IN', options);
  };

  const formatCurrentTime = () => {
    return formatTime(currentTime);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get student first name (capitalize first letter)
  const rawFirstName = status?.studentName?.split(' ')[0] || 'Student';
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase();

  // Calculate stats - today's exits only
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const totalExits = logs.filter(log => {
    if (!log.exitStatusTime) return false;
    const exitDate = parseDate(log.exitStatusTime);
    return exitDate && exitDate >= todayStart;
  }).length;
  const lastExitLog = logs.find(log => log.exitStatusTime);
  const lastExitDate = lastExitLog ? parseDate(lastExitLog.exitStatusTime) : null;
  const lastExitText = lastExitDate ? formatDate(lastExitDate) : 'No exits yet';



  const sortedLogs = [...logs].sort((a, b) => {
    const da = parseDate(a.decidedAt) || parseDate(a.entryStatusTime) || parseDate(a.exitStatusTime);
    const db = parseDate(b.decidedAt) || parseDate(b.entryStatusTime) || parseDate(b.exitStatusTime);
    const ta = da ? da.getTime() : 0;
    const tb = db ? db.getTime() : 0;
    return tb - ta;
  });

  return (
    <div className="sd-shell">
      {/* Header */}
      <header className="sd-header">
        <div className="sd-header-brand">
          <span className="sd-logo">GoThru</span>
          <span className="sd-logo-sub">by Watchr</span>
        </div>
        <div className="sd-header-actions">
          <div
            className="sd-profile-btn"
            onClick={() => navigate('/student/profile')}
          >
            {status?.imageUrl ? (
              <img
                src={`${API_BASE_URL}${status.imageUrl}`}
                alt="Profile"
                className="sd-profile-img"
              />
            ) : (
              <span className="sd-profile-initials">
                {firstName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="sd-main">
        {/* Stats Cards */}
        <div className="sd-stats-row">
          <div className="sd-stat-card">
            <div className="sd-stat-label">Current Status</div>
            <div className={`sd-stat-badge ${status?.presence === 'inside' ? 'inside' : 'outside'}`}>
              {status?.presence === 'inside' ? '🏠 Inside' : '🚶 Outside'}
            </div>
          </div>
          <div className="sd-stat-card">
            <div className="sd-stat-label">
              Active Gatepass
              <span className="sd-help-btn" onClick={() => setShowGpHelp(true)}>?</span>
            </div>
            <div className="sd-stat-value">
              {status?.activeGatePassNo || 'None'}
            </div>
          </div>
          <div className="sd-stat-card">
            <div className="sd-stat-label">Total Exits Today</div>
            <div className="sd-stat-value">{totalExits}</div>
          </div>
          <div className="sd-stat-card">
            <div className="sd-stat-label">Last Exit</div>
            <div className="sd-stat-value-sm">{lastExitText}</div>
          </div>
        </div>

        {/* Greeting Section */}
        <div className="sd-greeting">
          <div className="sd-greeting-text">
            <h1>{getGreeting()}, {firstName}</h1>
            <p className="sd-datetime">{formatCurrentDate()} | {formatCurrentTime()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="sd-actions-section">
          <div className="sd-section-label">QUICK ACTIONS</div>
          <div className="sd-actions-row">
            <button
              className="sd-action-btn primary"
              disabled={loading || status?.hasPendingRequest}
              onClick={handleApply}
            >
              <span className="sd-btn-icon">🚪</span>
              {loading ? 'Loading...' : status?.hasPendingRequest ? 'Request Pending' : actionLabel}
            </button>
            <button
              className="sd-action-btn primary"
              disabled={loading}
              onClick={() => navigate('/student/gatepass')}
            >
              <span className="sd-btn-icon">📄</span>
              Apply for Gatepass
            </button>
            <button
              className="sd-action-btn secondary"
              disabled={loading}
              onClick={() => navigate('/student/track-gatepass')}
            >
              <span className="sd-btn-icon">📍</span>
              Gatepass Status
            </button>
          </div>
        </div>

        {status?.hasPendingRequest && status?.pendingRequest && (
          <div className="sd-hint sd-hint-with-action">
            <span>A request is already pending. Ask the guard to scan your QR from the Apply page.</span>
            <button
              className="sd-hint-btn"
              onClick={() => navigate('/student/apply')}
            >
              Go to QR →
            </button>
          </div>
        )}

        {error && <div className="sd-error">{error}</div>}

        {/* Recent Activity */}
        <div className="sd-activity-section">
          <div className="sd-activity-header">
            <div className="sd-section-label">RECENT ACTIVITY</div>
            <span className="sd-view-all" onClick={() => setShowAllLogs(true)}>View All →</span>
          </div>
          <div className="sd-activity-table-container">
            {sortedLogs.length === 0 ? (
              <div className="sd-empty-state">No activity yet</div>
            ) : (
              <table className="sd-activity-table">
                <thead>
                  <tr>
                    <th>Purpose</th>
                    <th>Location</th>
                    <th>Exit</th>
                    <th>Entry</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLogs.map((log) => {
                    const exitDate = parseDate(log.exitStatusTime);
                    const entryDate = parseDate(log.entryStatusTime);

                    const isCompleted = exitDate && entryDate;
                    const isInProgress = exitDate && !entryDate;

                    return (
                      <tr key={log._id}>
                        <td className="sd-td-purpose">
                          {log.purpose}
                          {log.gatePassNo && (
                            <span className={`sd-gp-badge ${log.gatePassNo.startsWith('OS-') ? 'os' : 'local'}`}>
                              {log.gatePassNo.startsWith('OS-') ? 'OS' : 'L'}
                            </span>
                          )}
                        </td>
                        <td className="sd-td-location">{log.place}</td>
                        <td className="sd-td-time">
                          {exitDate ? formatTime(exitDate) : '--'}
                        </td>
                        <td className="sd-td-time">
                          {entryDate ? formatTime(entryDate) : '--'}
                        </td>
                        <td>
                          {isCompleted ? (
                            <span className="sd-status-badge completed">Completed</span>
                          ) : isInProgress ? (
                            <span className="sd-status-badge in-progress">In Progress</span>
                          ) : (
                            <span className="sd-status-badge pending">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sd-footer">
          GoThru v1.1 • RGIPT Campus Access System
        </div>
      </main>

      {/* Active Gatepass Help Modal */}
      {showGpHelp && (
        <div className="sd-modal-overlay" onClick={() => setShowGpHelp(false)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sd-modal-close" onClick={() => setShowGpHelp(false)}>×</button>
            <h3 className="sd-modal-title">What is Active Gatepass?</h3>
            <div className="sd-modal-content">
              <div className="sd-modal-section">
                <div className="sd-modal-label">Approved Gatepass</div>
                <p>A gatepass that has been approved by the hostel office but you haven't exited campus with it yet. You can have multiple approved gatepasses.</p>
              </div>
              <div className="sd-modal-section">
                <div className="sd-modal-label">Active Gatepass</div>
                <p>The gatepass you are <strong>currently using</strong> to be outside campus. This only shows when you have exited using a gatepass and haven't returned yet.</p>
              </div>
              <div className="sd-modal-note">
                <strong>Note:</strong> "None" means you are not currently outside campus using any gatepass. You may still have approved gatepasses waiting to be used.
              </div>
            </div>
            <button className="sd-modal-btn" onClick={() => setShowGpHelp(false)}>Got it</button>
          </div>
        </div>
      )}

      {/* Full Screen Activity Logs Modal */}
      {showAllLogs && (
        <div className="sd-fullscreen-modal" onClick={() => setShowAllLogs(false)}>
          <div className="sd-fullscreen-inner" onClick={(e) => e.stopPropagation()}>
            <div className="sd-fullscreen-header">
              <h2 className="sd-fullscreen-title">Activity History</h2>
              <button className="sd-fullscreen-close" onClick={() => setShowAllLogs(false)}>×</button>
            </div>
            <div className="sd-fullscreen-content">
              {sortedLogs.length === 0 ? (
                <div className="sd-empty-state">No activity yet</div>
              ) : (
                <table className="sd-activity-table sd-fullscreen-table">
                  <thead>
                    <tr>
                      <th>Purpose</th>
                      <th>Location</th>
                      <th>Exit</th>
                      <th>Entry</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLogs.map((log) => {
                      const exitDate = parseDate(log.exitStatusTime);
                      const entryDate = parseDate(log.entryStatusTime);
                      const isCompleted = exitDate && entryDate;
                      const isInProgress = exitDate && !entryDate;

                      return (
                        <tr key={log._id}>
                          <td className="sd-td-purpose">
                            {log.purpose}
                            {log.gatePassNo && (
                              <span className={`sd-gp-badge ${log.gatePassNo.startsWith('OS-') ? 'os' : 'local'}`}>
                                {log.gatePassNo.startsWith('OS-') ? 'OS' : 'L'}
                              </span>
                            )}
                          </td>
                          <td className="sd-td-location">{log.place}</td>
                          <td className="sd-td-time">
                            {exitDate ? `${formatTime(exitDate)} ${formatShortDate(exitDate)}` : '--'}
                          </td>
                          <td className="sd-td-time">
                            {entryDate ? `${formatTime(entryDate)} ${formatShortDate(entryDate)}` : '--'}
                          </td>
                          <td>
                            {isCompleted ? (
                              <span className="sd-status-badge completed">Completed</span>
                            ) : isInProgress ? (
                              <span className="sd-status-badge in-progress">In Progress</span>
                            ) : (
                              <span className="sd-status-badge pending">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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

export default StudentHome;
