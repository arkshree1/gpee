import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyGate, getStudentStatus, cancelGate } from '../api/api';
import '../styles/student.css';

const msLeft = (expiresAt) => {
  if (!expiresAt) return 0;
  const t = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, t);
};

const formatMMSS = (ms) => {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const StudentApply = () => {
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState('');
  const [place, setPlace] = useState('');
  const [direction, setDirection] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const [qr, setQr] = useState(null);
  // qr = { qrDataUrl, expiresAt, requestId }

  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNowTick((x) => x + 1), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getStudentStatus();
        setDirection(res.data.nextAction);
      } catch {
        // ignore; backend will reject apply anyway
      }
    })();
  }, []);

  // After QR is issued, poll status so we can return to home when guard scans/decides
  useEffect(() => {
    if (!qr) return undefined;

    const interval = setInterval(async () => {
      try {
        const res = await getStudentStatus();
        const data = res.data;
        if (!data.hasPendingRequest) {
          navigate('/student');
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [qr, navigate]);

  // recompute on tick so countdown updates.
  // eslint-disable-next-line no-unused-vars
  const _tick = nowTick;
  const remaining = msLeft(qr?.expiresAt);
  const expired = qr ? remaining <= 0 : false;

  const handleDismiss = async () => {
    if (!qr) {
      navigate('/student');
      return;
    }

    try {
      await cancelGate();
    } catch (e) {
      // Best-effort: even if cancel fails, go back; status polling on home will correct UI
    }

    navigate('/student');
  };

  const doApply = async () => {
    setApiError('');
    const trimmedPurpose = purpose.trim();
    const trimmedPlace = place.trim();

    // For exit we require purpose/place from user. For entry, backend will
    // ignore these and use stored outPurpose/outPlace.
    if (direction === 'exit' && (!trimmedPurpose || !trimmedPlace)) {
      setApiError('Purpose and place are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await applyGate({ purpose: trimmedPurpose, place: trimmedPlace });
      setQr({
        requestId: res.data.requestId,
        qrDataUrl: res.data.qrDataUrl,
        expiresAt: res.data.expiresAt,
      });
    } catch (e) {
      setApiError(e?.response?.data?.message || 'Failed to apply');
    } finally {
      setSubmitting(false);
    }
  };

  const isExit = direction === 'exit';
  const title = isExit ? (qr ? 'Applying for Exit' : 'Apply for Exit') : direction === 'entry' ? (qr ? 'Applying for Entry' : 'Apply for Entry') : 'Apply';

  return (
    <div className="student-shell">
      <header className="student-header">
        <button className="student-back" type="button" onClick={() => navigate('/student')}>
          Back
        </button>
        <div>
          <div className="brand">Passly</div>
          <div className="sub">by Watchr</div>
        </div>
      </header>

      <main className="student-main">
        <h1 className="student-title">{title}</h1>

        {!qr && isExit && (
          <div className="student-form">
            <label className="student-label">
              Enter your Purpose
              <input className="student-input" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </label>

            <label className="student-label">
              Enter Place
              <input className="student-input" value={place} onChange={(e) => setPlace(e.target.value)} />
            </label>

            <button className="student-apply-btn" type="button" disabled={submitting} onClick={doApply}>
              {submitting ? 'Applying...' : 'APPLY'}
            </button>

            {apiError && <div className="student-error">{apiError}</div>}
          </div>
        )}

        {!qr && !isExit && (
          <div className="student-form">
            <button
              className="student-apply-btn"
              type="button"
              disabled={submitting}
              onClick={doApply}
            >
              {submitting ? 'Applying...' : 'Generate Entry QR'}
            </button>

            {apiError && <div className="student-error">{apiError}</div>}
          </div>
        )}

        {qr && (
          <div className="student-qr-section">
            <div className="student-qr-card">
              <div className="student-qr-top">Show this QR to the guard</div>
              {expired ? (
                <div className="student-expired">QR expired. Please apply again.</div>
              ) : (
                <>
                  <img className="student-qr" src={qr.qrDataUrl} alt="Gate Pass QR" />
                  <div className="student-timer">Expires in {formatMMSS(remaining)}</div>
                </>
              )}
              {!expired && (
                <button
                  type="button"
                  className="student-dismiss-btn"
                  onClick={handleDismiss}
                >
                  {isExit ? 'Not going outside? Dismiss QR' : 'Not going inside? Dismiss QR'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentApply;
