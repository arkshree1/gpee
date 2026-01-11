import React, { useEffect, useMemo, useState } from 'react';
import { decideRequest, getGuardDashboard, getGuardEntryExitLogs, scanQrToken } from '../api/api';
import GuardScanner from '../components/GuardScanner';
import GuardEntryExitTable from '../components/GuardEntryExitTable';
import GuardManualEntry from '../components/GuardManualEntry';
import '../styles/student.css';

const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const GuardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const [activeTab, setActiveTab] = useState('scan');
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
  // pending = { requestId, direction, purpose, place, student{..., outPurpose, outPlace, outTime} }
  const [decisionLoading, setDecisionLoading] = useState(false);

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

  const refresh = async () => {
    try {
      const res = await getGuardDashboard();
      setDashboard(res.data);
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
    try {
      const res = await scanQrToken({ token });
      setPending(res.data);
      setScannerOpen(false);
    } catch (e) {
      setScanError(e?.response?.data?.message || 'Invalid/expired/used token');
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
          <span className="guard-header-passly">GoThru</span>
          <span className="guard-header-by">
            by <strong>Watchr</strong>
          </span>
        </div>
      </header>

      <div className="guard-body">
        <aside className="guard-sidebar">
          <button
            type="button"
            className={`guard-nav-item ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            <div className="guard-nav-icon">
              <span className="guard-nav-label">Scan</span>
            </div>
          </button>

          <button
            type="button"
            className={`guard-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <div className="guard-nav-icon">
              <span className="guard-nav-label">Entry</span>
            </div>
          </button>

          <button
            type="button"
            className={`guard-nav-item ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <div className="guard-nav-icon">
              <span className="guard-nav-label">Manual</span>
            </div>
          </button>
        </aside>

        <main className="guard-main">
          {activeTab === 'scan' && (
            <div className="guard-scan-page">
              {scanError && <div className="guard-error-banner">{scanError}</div>}
              <button
                className="guard-scan-button"
                type="button"
                onClick={() => setScannerOpen(true)}
              >
                SCAN
              </button>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="guard-logs-page">
              <div className="guard-logs-header-row">
                <div className="guard-logs-title">ENTRY-EXIT LOG</div>
                <div className="guard-logs-date">
                  <input
                    type="date"
                    value={logsDate}
                    onChange={(e) => setLogsDate(e.target.value)}
                  />
                </div>
                <div className="guard-logs-search">
                  <input
                    type="text"
                    placeholder="Search"
                    value={logsSearch}
                    onChange={(e) => setLogsSearch(e.target.value)}
                  />
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

      {pending && (
        <div className="guard-approval-overlay">
          <div className="guard-approval-card">
            <div className="guard-approval-header">
              <div className="guard-approval-title">Approval Screen</div>
              <div className="guard-pill" style={{ textTransform: 'capitalize' }}>
                {pending.direction}
              </div>
            </div>

            <div className="guard-approval-body">
              <div className="guard-approval-photo-col">
                <img className="guard-photo-xl" src={photoSrc} alt="Student" />
              </div>

              <div className="guard-approval-info">
                <div className="guard-approval-name">{pending.student?.name}</div>
                <div className="guard-approval-roll">Roll No: {pending.student?.rollnumber}</div>

                <div className="guard-approval-fields">
                  {pending.direction === 'exit' && (
                    <>
                      {/* Gatepass Badge */}
                      {pending.gatePassNo && (
                        <div style={{
                          background: 'linear-gradient(135deg, #9904b6 0%, #6b0080 100%)',
                          color: '#fff',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '16px',
                          textAlign: 'center',
                          marginBottom: '12px',
                          boxShadow: '0 2px 8px rgba(153, 4, 182, 0.4)',
                        }}>
                          🎫 Gatepass: {pending.gatePassNo}
                        </div>
                      )}
                      <div>
                        <label>Purpose</label>
                        <div className="guard-approval-value">{pending.purpose}</div>
                      </div>
                      <div>
                        <label>Place</label>
                        <div className="guard-approval-value">{pending.place}</div>
                      </div>
                      {/* Gatepass Scheduled Times */}
                      {pending.gatepassDetails && (
                        <>
                          <div style={{
                            marginTop: '10px',
                            padding: '10px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}>
                            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '6px', fontWeight: 600 }}>
                              SCHEDULED TIMES
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                              <div>
                                <span style={{ opacity: 0.7 }}>Out: </span>
                                <span style={{ fontWeight: 600 }}>
                                  {(() => {
                                    const dt = pending.gatepassDetails.gatepassOutTime;
                                    if (!dt) return '-';
                                    const [datePart, timePart] = dt.split('T');
                                    const dateFormatted = datePart?.split('-').reverse().join('/') || '';
                                    const t = timePart?.split(':');
                                    if (!t || t.length < 2) return dateFormatted;
                                    let h = parseInt(t[0], 10);
                                    const m = t[1];
                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                    h = h % 12 || 12;
                                    return `${dateFormatted} ${h}:${m} ${ampm}`;
                                  })()}
                                </span>
                              </div>
                              <div>
                                <span style={{ opacity: 0.7 }}>In: </span>
                                <span style={{ fontWeight: 600 }}>
                                  {(() => {
                                    const dt = pending.gatepassDetails.gatepassInTime;
                                    if (!dt) return '-';
                                    const [datePart, timePart] = dt.split('T');
                                    const dateFormatted = datePart?.split('-').reverse().join('/') || '';
                                    const t = timePart?.split(':');
                                    if (!t || t.length < 2) return dateFormatted;
                                    let h = parseInt(t[0], 10);
                                    const m = t[1];
                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                    h = h % 12 || 12;
                                    return `${dateFormatted} ${h}:${m} ${ampm}`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {pending.direction === 'entry' && (
                    <>
                      {/* Gatepass Badge for Entry */}
                      {pending.gatePassNo && (
                        <div style={{
                          background: 'linear-gradient(135deg, #16a34a 0%, #0f6d32 100%)',
                          color: '#fff',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '16px',
                          textAlign: 'center',
                          marginBottom: '12px',
                          boxShadow: '0 2px 8px rgba(22, 163, 74, 0.4)',
                        }}>
                          🎫 Gatepass Entry: {pending.gatePassNo}
                        </div>
                      )}
                      <div>
                        <label>Out Purpose</label>
                        <div className="guard-approval-value">{pending.student?.outPurpose || '-'}</div>
                      </div>
                      <div>
                        <label>Out Place</label>
                        <div className="guard-approval-value">{pending.student?.outPlace || '-'}</div>
                      </div>
                      <div>
                        <label>Actual Out Time</label>
                        <div className="guard-approval-value">
                          {pending.student?.outTime
                            ? formatOutTime(pending.student.outTime)
                            : '-'}
                        </div>
                      </div>
                      <div>
                        <label>Total Time Out</label>
                        <div className="guard-approval-value">{totalTimeOut || '-'}</div>
                      </div>
                      {/* Gatepass Scheduled Return Time */}
                      {pending.gatepassDetails?.gatepassInTime && (
                        <div style={{
                          marginTop: '10px',
                          padding: '8px 10px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          fontSize: '12px',
                        }}>
                          <span style={{ opacity: 0.7 }}>Scheduled Return: </span>
                          <span style={{ fontWeight: 600 }}>
                            {(() => {
                              const dt = pending.gatepassDetails.gatepassInTime;
                              if (!dt) return '-';
                              const [datePart, timePart] = dt.split('T');
                              const dateFormatted = datePart?.split('-').reverse().join('/') || '';
                              const t = timePart?.split(':');
                              if (!t || t.length < 2) return dateFormatted;
                              let h = parseInt(t[0], 10);
                              const m = t[1];
                              const ampm = h >= 12 ? 'PM' : 'AM';
                              h = h % 12 || 12;
                              return `${dateFormatted} ${h}:${m} ${ampm}`;
                            })()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="guard-approval-actions">
                  <button
                    className="guard-btn danger"
                    type="button"
                    disabled={decisionLoading}
                    onClick={() => doDecide('reject')}
                  >
                    Reject
                  </button>
                  <button
                    className="guard-btn"
                    type="button"
                    disabled={decisionLoading}
                    onClick={() => doDecide('approve')}
                  >
                    {decisionLoading ? 'Saving...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {scannerOpen && <GuardScanner onToken={onToken} onClose={() => setScannerOpen(false)} />}
    </div>
  );
};

export default GuardPage;
