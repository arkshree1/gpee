import React, { useEffect, useMemo, useState } from 'react';
import { decideRequest, getGuardDashboard, scanQrToken } from '../api/api';
import GuardScanner from '../components/GuardScanner';
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

  const [pending, setPending] = useState(null);
  // pending = { requestId, direction, purpose, place, student{...} }
  const [decisionLoading, setDecisionLoading] = useState(false);

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

  return (
    <div className="guard-shell">
      <div className="guard-topbar">
        <div className="guard-title">Guard Dashboard</div>
        <div className="guard-actions">
          <button className="guard-btn" type="button" onClick={() => setScannerOpen(true)}>
            Scan QR
          </button>
          <button className="guard-btn ghost" type="button" onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>

      {scanError && <div className="guard-error">{scanError}</div>}

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
                  <div>
                    <label>Purpose</label>
                    <div className="guard-approval-value">{pending.purpose}</div>
                  </div>
                  <div>
                    <label>Place</label>
                    <div className="guard-approval-value">{pending.place}</div>
                  </div>
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

      <div className="guard-grid">
        <div className="guard-card">
          <h3>Entry / Exit Logs</h3>
          <div className="guard-card-body">
            {loading && <div>Loading...</div>}
            {!loading && (
              <table className="guard-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Student</th>
                    <th>Action</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.logs || []).map((l) => (
                    <tr key={l._id}>
                      <td>{new Date(l.decidedAt).toLocaleString()}</td>
                      <td>
                        {l.student?.name}
                        <div className="guard-muted">{l.student?.rollnumber}</div>
                      </td>
                      <td>{l.direction}</td>
                      <td>
                        <span className="guard-pill">{l.outcome}</span>
                      </td>
                    </tr>
                  ))}
                  {(dashboard?.logs || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="guard-muted">
                        No logs yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="guard-card">
          <h3>Students Currently Outside</h3>
          <div className="guard-card-body">
            {(dashboard?.outside || []).length === 0 ? (
              <div className="guard-muted">Nobody outside</div>
            ) : (
              <table className="guard-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.outside || []).map((s) => (
                    <tr key={s._id}>
                      <td>{s.name}</td>
                      <td>{s.rollnumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="guard-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Rejected Requests</h3>
          <div className="guard-card-body">
            {(dashboard?.rejected || []).length === 0 ? (
              <div className="guard-muted">No rejections</div>
            ) : (
              <table className="guard-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Student</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.rejected || []).map((l) => (
                    <tr key={l._id}>
                      <td>{new Date(l.decidedAt).toLocaleString()}</td>
                      <td>
                        {l.student?.name}
                        <div className="guard-muted">{l.student?.rollnumber}</div>
                      </td>
                      <td>{l.direction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {scannerOpen && <GuardScanner onToken={onToken} onClose={() => setScannerOpen(false)} />}
    </div>
  );
};

export default GuardPage;
