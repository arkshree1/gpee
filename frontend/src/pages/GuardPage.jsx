import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { decideRequest, getGuardDashboard, getGuardEntryExitLogs, scanQrToken } from '../api/api';
import GuardScanner from '../components/GuardScanner';
import GuardEntryExitTable from '../components/GuardEntryExitTable';
import GuardManualEntry from '../components/GuardManualEntry';
import '../styles/guard.css';

const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const GuardPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'scan');

  // Persist activeTab to URL
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);
  const [entryExitLogs, setEntryExitLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsDate, setLogsDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [pending, setPending] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isMountedRef = useRef(true);
  const refreshInProgressRef = useRef(false);
  const abortControllerRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatOutTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
  };

  const refresh = useCallback(async () => {
    // Prevent overlapping requests
    if (refreshInProgressRef.current) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    refreshInProgressRef.current = true;

    try {
      await getGuardDashboard({ signal: abortControllerRef.current.signal });
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        // Dashboard data loaded
      }
    } catch (error) {
      // Silently ignore abort errors and network errors during polling
      // Only log non-abort errors for debugging
      if (error?.name !== 'AbortError' && error?.code !== 'ERR_CANCELED') {
        console.debug('Guard dashboard refresh failed:', error?.message || 'Network error');
      }
    } finally {
      refreshInProgressRef.current = false;
      if (isMountedRef.current) {
        // Loading complete
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    refresh();
    const id = setInterval(refresh, 5000);
    return () => {
      isMountedRef.current = false;
      clearInterval(id);
      // Cancel any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refresh]);

  useEffect(() => {
    if (activeTab !== 'logs' || logsLoading || entryExitLogs.length) return;
    const loadLogs = async () => {
      try {
        setLogsLoading(true);
        const res = await getGuardEntryExitLogs();
        setEntryExitLogs(res.data.logs || []);
      } catch (e) {
        // optional: reuse scan error banner area for logs load errors
        setScanError(e?.response?.data?.message || 'Failed to load entry-exit logs');
      } finally {
        setLogsLoading(false);
      }
    };
    loadLogs();
  }, [activeTab, logsLoading, entryExitLogs.length]);

  const onToken = async (token) => {
    setScanError('');
    setScannerOpen(false);
    setVerifying(true);
    try {
      const res = await scanQrToken({ token });
      setPending(res.data);
    } catch (e) {
      setScanError(e?.response?.data?.message || 'Invalid/expired/used token');
    } finally {
      setVerifying(false);
    }
  };

  const prettyDirection = useMemo(() => {
    if (!pending?.direction) return '';
    return pending.direction === 'exit' ? 'Exit' : 'Entry';
  }, [pending]);

  const totalTimeOut = useMemo(() => {
    if (!pending || !pending.student?.outTime) return '';
    const start = new Date(pending.student.outTime).getTime();
    const diffMs = Date.now() - start;
    if (Number.isNaN(diffMs) || diffMs <= 0) return '0 minutes';

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }, [pending]);

  const doDecide = async (decision) => {
    if (!pending?.requestId) return;
    setDecisionLoading(true);
    try {
      await decideRequest({ requestId: pending.requestId, decision });
      setPending(null);
      await refresh();
    } catch (e) {
      setScanError(e?.response?.data?.message || 'Failed to submit decision');
    } finally {
      setDecisionLoading(false);
    }
  };

  const fallbackAvatar =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="#9aa5b1" stroke="#6b7280"><circle cx="60" cy="42" r="26" fill="#cbd5e1"/><path d="M16 114c0-24 18-42 44-42s44 18 44 42" fill="#cbd5e1"/></svg>'
    );

  const photoSrc = pending?.student?.imageUrl
    ? normalizeImageUrl(pending.student.imageUrl)
    : fallbackAvatar;

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

  const filteredEntryExitLogs = useMemo(() => {
    let base = entryExitLogs;

    if (logsDate) {
      const target = new Date(logsDate);
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

    const trimmed = logsSearch.trim();
    if (!trimmed) return base;
    const q = trimmed.toLowerCase();
    return base.filter((l) => {
      const s = l.student || {};
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.rollnumber && s.rollnumber.toLowerCase().includes(q))
      );
    });
  }, [entryExitLogs, logsSearch, logsDate]);

  return (
    <div className="guard-layout">
      <header className="guard-header">
        <div className="guard-header-brand">
          <div className="guard-header-logo-wrap">
            <span className="guard-header-logo">GoThru</span>
            <span className="guard-header-subtitle">by Watchr</span>
          </div>
        </div>
        <div className="guard-header-right">
          <span className="guard-header-role">Security Guard</span>
          <button className="guard-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="guard-body">
        <aside className="guard-sidebar">
          <nav className="guard-sidebar-nav">
            <button
              type="button"
              className={`guard-nav-item ${activeTab === 'scan' ? 'active' : ''}`}
              onClick={() => setActiveTab('scan')}
            >
              <svg className="guard-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="guard-nav-label">Scan QR</span>
            </button>

            <button
              type="button"
              className={`guard-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <svg className="guard-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="guard-nav-label">Entry Logs</span>
            </button>

            <button
              type="button"
              className={`guard-nav-item ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <svg className="guard-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="guard-nav-label">Manual Entry</span>
            </button>
          </nav>
        </aside>

        <main className="guard-main">
          {activeTab === 'scan' && (
            <div className="guard-scan-page">
              <div className="guard-scan-content">
                {scanError && (
                  <div className="guard-error-banner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{scanError}</span>
                    <button onClick={() => setScanError('')}>×</button>
                  </div>
                )}

                <div className="guard-scan-card">
                  <div className="guard-scan-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 17h3v4h-3zM17 14h4v3h-4z" />
                    </svg>
                  </div>
                  <h2 className="guard-scan-title">Ready to Scan</h2>
                  <p className="guard-scan-subtitle">Tap the button below to scan student's QR code</p>
                  <button
                    className="guard-scan-button"
                    type="button"
                    onClick={() => setScannerOpen(true)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <span>Scan QR Code</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="guard-logs-page">
              <div className="guard-logs-header">
                <h2 className="guard-logs-title">Entry-Exit Logs</h2>
                <div className="guard-logs-filters">
                  <div className="guard-filter-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={logsDate}
                      onChange={(e) => setLogsDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="guard-date-input"
                    />
                  </div>
                  <div className="guard-filter-group">
                    <label>Search</label>
                    <input
                      type="text"
                      placeholder="Name or Roll No..."
                      value={logsSearch}
                      onChange={(e) => setLogsSearch(e.target.value)}
                      className="guard-search-input"
                    />
                  </div>
                </div>
              </div>
              <GuardEntryExitTable
                logs={filteredEntryExitLogs}
                loading={logsLoading}
                formatLogTime={formatLogTime}
              />
            </div>
          )}

          {activeTab === 'manual' && (
            <GuardManualEntry
              onExitCompleted={() => {
                refresh();
                setEntryExitLogs([]);
              }}
            />
          )}
        </main>
      </div>

      {/* Approval Modal */}
      {pending && (
        <div className="guard-approval-overlay">
          <div className="guard-approval-modal">
            <div className="guard-approval-header">
              <h3>Student {prettyDirection} Request</h3>
              <span className={`guard-direction-badge ${pending.direction}`}>
                {prettyDirection}
              </span>
            </div>

            <div className="guard-approval-body">
              <div className="guard-approval-photo-section">
                <img 
                  className="guard-approval-photo" 
                  src={photoSrc} 
                  alt="Student"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackAvatar;
                  }}
                />
              </div>

              <div className="guard-approval-details">
                <div className="guard-student-name">{pending.student?.name}</div>
                <div className="guard-student-roll">{pending.student?.rollnumber}</div>

                {pending.gatePassNo && (
                  <div className="guard-gatepass-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                    </svg>
                    <span>{pending.gatePassNo}</span>
                  </div>
                )}

                <div className="guard-info-grid">
                  {pending.direction === 'exit' ? (
                    <>
                      <div className="guard-info-item">
                        <label>Purpose</label>
                        <div className="guard-info-value">{pending.purpose || '-'}</div>
                      </div>
                      <div className="guard-info-item">
                        <label>Place</label>
                        <div className="guard-info-value">{pending.place || '-'}</div>
                      </div>
                      {pending.gatepassDetails && (
                        <div className="guard-info-item full-width">
                          <label>Scheduled Times</label>
                          <div className="guard-scheduled-times">
                            <span>
                              <strong>Out:</strong> {formatScheduledTime(pending.gatepassDetails.gatepassOutTime)}
                            </span>
                            <span>
                              <strong>In:</strong> {formatScheduledTime(pending.gatepassDetails.gatepassInTime)}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="guard-info-item">
                        <label>Out Purpose</label>
                        <div className="guard-info-value">{pending.student?.outPurpose || '-'}</div>
                      </div>
                      <div className="guard-info-item">
                        <label>Out Place</label>
                        <div className="guard-info-value">{pending.student?.outPlace || '-'}</div>
                      </div>
                      <div className="guard-info-item">
                        <label>Exit Time</label>
                        <div className="guard-info-value">{formatOutTime(pending.student?.outTime) || '-'}</div>
                      </div>
                      <div className="guard-info-item">
                        <label>Time Outside</label>
                        <div className="guard-info-value highlight">{totalTimeOut || '-'}</div>
                      </div>
                      {pending.gatepassDetails?.gatepassInTime && (
                        <div className="guard-info-item full-width">
                          <label>Scheduled Return</label>
                          <div className="guard-info-value">{formatScheduledTime(pending.gatepassDetails.gatepassInTime)}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="guard-approval-actions">
                  <button
                    className="guard-action-btn reject"
                    type="button"
                    disabled={decisionLoading}
                    onClick={() => doDecide('reject')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    Reject
                  </button>
                  <button
                    className="guard-action-btn approve"
                    type="button"
                    disabled={decisionLoading}
                    onClick={() => doDecide('approve')}
                  >
                    {decisionLoading ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Approve
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {scannerOpen && <GuardScanner onToken={onToken} onClose={() => setScannerOpen(false)} />}

      {/* Verifying loader overlay */}
      {verifying && (
        <div className="guard-scanner-overlay">
          <div className="guard-verifying-modal">
            <div className="guard-verifying-spinner"></div>
            <div className="guard-verifying-text">Verifying...</div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="guard-mobile-nav">
        <button
          type="button"
          className={`guard-mobile-nav-item ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>Scan</span>
        </button>
        <button
          type="button"
          className={`guard-mobile-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Logs</span>
        </button>
        <button
          type="button"
          className={`guard-mobile-nav-item ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Manual</span>
        </button>
      </nav>
    </div>
  );
};

// Helper function for formatting scheduled times
const formatScheduledTime = (dt) => {
  if (!dt) return '-';
  const [datePart, timePart] = dt.split('T');
  const [, month, day] = datePart?.split('-') || [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${parseInt(day, 10)} ${monthNames[parseInt(month, 10) - 1]}`;
  const t = timePart?.split(':');
  if (!t || t.length < 2) return formattedDate;
  let h = parseInt(t[0], 10);
  const m = t[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${formattedDate} ${h}:${m} ${ampm}`;
};

export default GuardPage;
