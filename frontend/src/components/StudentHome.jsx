import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentStatus, getStudentLogs } from '../api/api';
import '../styles/student.css';

const StudentHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

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

  const sortedLogs = [...logs].sort((a, b) => {
    const da = parseDate(a.decidedAt) || parseDate(a.entryStatusTime) || parseDate(a.exitStatusTime);
    const db = parseDate(b.decidedAt) || parseDate(b.entryStatusTime) || parseDate(b.exitStatusTime);
    const ta = da ? da.getTime() : 0;
    const tb = db ? db.getTime() : 0;
    return tb - ta; // recent first
  });

  return (
    <div className="student-shell">
      <header className="student-header">
        <div>
          <div className="brand">Passly</div>
          <div className="sub">by Watchr</div>
        </div>
      </header>

      <main className="student-main">
        <button
          className="student-primary-btn"
          type="button"
          disabled={loading || status?.hasPendingRequest}
          onClick={handleApply}
        >
          {loading ? 'Loading...' : status?.hasPendingRequest ? 'Request Pending' : actionLabel}
        </button>

        <button
          className="student-primary-btn"
          type="button"
          disabled={loading}
          onClick={() => navigate('/student/gatepass')}
        >
          Apply for Gatepass
        </button>

        <button
          className="student-primary-btn"
          type="button"
          disabled={loading}
          onClick={() => navigate('/student/track-gatepass')}
        >
          Track Gatepass
        </button>

        {status?.hasPendingRequest && status?.pendingRequest && (
          <div className="student-hint">
            A request is already pending. Ask the guard to scan your QR from the Apply page.
          </div>
        )}

        {error && <div className="student-error">{error}</div>}

        {logs.length > 0 && (
          <div className="student-history">
            <h3 className="student-history-title">Visit History</h3>
            <div className="student-history-table-wrapper">
              <table className="student-history-table">
                <thead>
                  <tr>
                    <th>Purpose</th>
                    <th>Place</th>
                    <th>Out Time</th>
                    <th>In Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLogs.map((log) => {
                    const exitDate = parseDate(log.exitStatusTime);
                    const entryDate = parseDate(log.entryStatusTime);

                    const outIsDenied = log.exitOutcome === 'denied';
                    const inIsDenied = log.entryOutcome === 'denied';

                    const outTop = outIsDenied
                      ? 'EXIT DENIED'
                      : exitDate
                        ? formatTime(exitDate)
                        : '--';

                    const outBottom = outIsDenied
                      ? exitDate
                        ? `${formatTime(exitDate)} ${formatDate(exitDate)}`
                        : ''
                      : exitDate
                        ? formatDate(exitDate)
                        : '';

                    const inTop = inIsDenied
                      ? 'ENTRY DENIED'
                      : entryDate
                        ? formatTime(entryDate)
                        : '--';

                    const inBottom = inIsDenied
                      ? entryDate
                        ? `${formatTime(entryDate)} ${formatDate(entryDate)}`
                        : ''
                      : entryDate
                        ? formatDate(entryDate)
                        : '';

                    return (
                      <tr key={log._id}>
                        <td className="student-history-purpose">{log.purpose}</td>
                        <td className="student-history-place">{log.place}</td>
                        <td className="student-history-out">
                          <div className="student-history-main">{outTop}</div>
                          {outBottom && (
                            <div className="student-history-sub">{outBottom}</div>
                          )}
                        </td>
                        <td className="student-history-in">
                          <div className="student-history-main">{inTop}</div>
                          {inBottom && (
                            <div className="student-history-sub">{inBottom}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentHome;
