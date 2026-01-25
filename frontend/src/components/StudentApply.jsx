import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyGate, getStudentStatus, cancelGate } from '../api/api';
import '../styles/student-dashboard.css';

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
  const [nowTick, setNowTick] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rejectionInfo, setRejectionInfo] = useState(null);

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
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!qr) return undefined;
    const interval = setInterval(async () => {
      try {
        const res = await getStudentStatus();
        if (!res.data.hasPendingRequest) {
          // Check if there was a recent rejection
          if (res.data.recentRejection) {
            setRejectionInfo(res.data.recentRejection);
            // Auto-redirect after 3 seconds
            setTimeout(() => {
              navigate('/student');
            }, 3000);
          } else {
            navigate('/student');
          }
        }
      } catch (e) { }
    }, 2000);
    return () => clearInterval(interval);
  }, [qr, navigate]);

  useEffect(() => {
    if (!qr) return undefined;
    window.history.pushState({ qrScreen: true }, '');
    const handlePopState = (event) => {
      event.preventDefault();
      setShowConfirmModal(true);
      window.history.pushState({ qrScreen: true }, '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [qr]);

  // eslint-disable-next-line no-unused-vars
  const _tick = nowTick;
  const remaining = msLeft(qr?.expiresAt);
  const expired = qr ? remaining <= 0 : false;

  const confirmDismiss = async () => {
    setShowConfirmModal(false);
    if (!qr) {
      navigate('/student');
      return;
    }
    try {
      await cancelGate();
    } catch (e) { }
    navigate('/student');
  };

  const handleDismissClick = () => {
    if (!qr) {
      navigate('/student');
      return;
    }
    setShowConfirmModal(true);
  };

  const doApply = async () => {
    setApiError('');
    const trimmedPurpose = purpose.trim();
    const trimmedPlace = place.trim();

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
  const title = rejectionInfo
    ? (rejectionInfo.direction === 'exit' ? 'Exit Denied' : 'Entry Denied')
    : isExit
      ? (qr ? 'Exit QR Generated' : 'Apply for Exit')
      : direction === 'entry'
        ? (qr ? 'Entry QR Generated' : 'Apply for Entry')
        : 'Apply';

  // If there's a rejection, show rejection screen
  if (rejectionInfo) {
    return (
      <div className="sd-shell">
        {/* Header */}
        <header className="sd-header">
          <div className="sd-header-brand">
            <span className="sd-logo">GoThru</span>
            <span className="sd-logo-sub">by Watchr</span>
          </div>
        </header>

        <main className="sd-main sa-main">
          <div className="sa-rejection-screen">
            <div className="sa-rejection-icon">❌</div>
            <h1 className="sa-rejection-title">
              {rejectionInfo.direction === 'exit' ? 'Exit Denied' : 'Entry Denied'}
            </h1>
            <p className="sa-rejection-message">
              Your {rejectionInfo.direction} request was rejected by the guard.
            </p>
            <p className="sa-rejection-redirect">
              Redirecting to home in 3 seconds...
            </p>
            <button
              className="sa-submit-btn"
              type="button"
              onClick={() => navigate('/student')}
            >
              Go to Home Now
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="sd-shell">
      {/* Header */}
      <header className="sd-header">
        <div className="sd-header-brand">
          <span className="sd-logo">GoThru</span>
          <span className="sd-logo-sub">by Watchr</span>
        </div>
        <button
          className="sa-back-btn"
          onClick={() => qr ? handleDismissClick() : navigate('/student')}
        >
          Back →
        </button>
      </header>

      <main className="sd-main sa-main">
        <h1 className="sa-title">{title}</h1>

        {/* Form - before QR */}
        {!qr && isExit && (
          <div className="sa-form">
            <div className="sa-field">
              <label className="sa-label">Enter your Purpose</label>
              <input
                className="sa-input"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Medical, Shopping, Personal"
              />
            </div>

            <div className="sa-field">
              <label className="sa-label">Enter Place</label>
              <input
                className="sa-input"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g., Market, Hospital, Home"
              />
            </div>

            <button
              className="sa-submit-btn"
              type="button"
              disabled={submitting}
              onClick={doApply}
            >
              {submitting ? 'Generating...' : '🚪 Generate Exit QR'}
            </button>

            {apiError && <div className="sa-error">{apiError}</div>}
          </div>
        )}

        {/* Entry - just generate button */}
        {!qr && !isExit && (
          <div className="sa-form">
            <p className="sa-info">Click below to generate your entry QR code.</p>
            <button
              className="sa-submit-btn"
              type="button"
              disabled={submitting}
              onClick={doApply}
            >
              {submitting ? 'Generating...' : '🏠 Generate Entry QR'}
            </button>
            {apiError && <div className="sa-error">{apiError}</div>}
          </div>
        )}

        {/* QR Display */}
        {qr && (
          <div className="sa-qr-section">
            <div className="sa-qr-card">
              <div className="sa-qr-instruction">Show this QR to the guard</div>
              {expired ? (
                <div className="sa-expired">
                  ⏰ QR expired. Please apply again.
                </div>
              ) : (
                <>
                  <img className="sa-qr-image" src={qr.qrDataUrl} alt="Gate Pass QR" />
                  <div className="sa-timer">
                    Expires in <span className="sa-timer-value">{formatMMSS(remaining)}</span>
                  </div>
                </>
              )}
              {!expired && (
                <button
                  type="button"
                  className="sa-dismiss-btn"
                  onClick={handleDismissClick}
                >
                  {isExit ? 'Not going outside? Cancel' : 'Not going inside? Cancel'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="sd-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sd-modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
            <h3 className="sd-modal-title">Are you sure?</h3>
            <div className="sd-modal-content">
              <p style={{ margin: 0, fontSize: '14px', color: '#555', lineHeight: 1.5 }}>
                {isExit
                  ? 'This will cancel your exit request and you will need to apply again.'
                  : 'This will cancel your entry request and you will need to apply again.'
                }
              </p>
            </div>
            <div className="sa-confirm-actions">
              <button
                className="sa-confirm-btn no"
                onClick={() => setShowConfirmModal(false)}
              >
                No, Keep QR
              </button>
              <button
                className="sa-confirm-btn yes"
                onClick={confirmDismiss}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentApply;
