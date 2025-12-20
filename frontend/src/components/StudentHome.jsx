import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentStatus } from '../api/api';
import '../styles/student.css';

const StudentHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  const actionLabel = useMemo(() => {
    if (!status) return '...';
    return status.nextAction === 'exit' ? 'Apply for Exit' : 'Apply for Entry';
  }, [status]);

  const refresh = async () => {
    setError('');
    try {
      const res = await getStudentStatus();
      setStatus(res.data);
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

        {status?.hasPendingRequest && status?.pendingRequest && (
          <div className="student-hint">
            A request is already pending. Ask the guard to scan your QR from the Apply page.
          </div>
        )}

        {error && <div className="student-error">{error}</div>}
      </main>
    </div>
  );
};

export default StudentHome;
