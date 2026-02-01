import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyGate, getStudentStatus, cancelGate } from '../api/api';
import { initSocket, onGateDecision, disconnectSocket, emitQrCancelled } from '../utils/socket';
import '../styles/student-dashboard.css';

// Professional SVG Icons
const Icons = {
  doorExit: <svg className="sa-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  doorEntry: <svg className="sa-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>,
  clock: <svg className="sa-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  x: <svg className="sa-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
  arrowLeft: <svg className="sa-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
};

// localStorage key for persisting QR state
const QR_STORAGE_KEY = 'gpee_pending_qr';

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
  const [approvalInfo, setApprovalInfo] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNowTick((x) => x + 1), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // First check localStorage for a persisted QR
        const storedQr = localStorage.getItem(QR_STORAGE_KEY);
        if (storedQr) {
          const parsed = JSON.parse(storedQr);
          if (new Date(parsed.expiresAt) > new Date()) {
            // QR still valid, restore it
            setQr(parsed);
          } else {
            // QR expired, clear localStorage
            localStorage.removeItem(QR_STORAGE_KEY);
          }
        }

        const res = await getStudentStatus();
        setDirection(res.data.nextAction);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Socket.IO real-time listener for gate decisions (replaces polling)
  useEffect(() => {
    if (!qr) return undefined;

    // Initialize socket connection with auth token
    const token = localStorage.getItem('token');
    initSocket(token);

    // Listen for gate-decision events
    const unsubscribe = onGateDecision(async (data) => {
      console.log('🔔 Received gate-decision:', data);

      // Clear localStorage since request is resolved
      localStorage.removeItem(QR_STORAGE_KEY);

      if (data.outcome === 'rejected') {
        // Show rejection info briefly then navigate
        setRejectionInfo({
          reason: 'Request was denied by guard',
          timestamp: data.decidedAt,
          direction: data.direction,
        });
        setTimeout(() => {
          navigate('/student');
        }, 3000);
      } else {
        // Approved - show approval screen briefly then navigate
        setApprovalInfo({
          timestamp: data.decidedAt,
          direction: data.direction,
        });
        setTimeout(() => {
          navigate('/student');
        }, 2500);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
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
    // Clear localStorage on dismiss
    localStorage.removeItem(QR_STORAGE_KEY);
    if (!qr) {
      navigate('/student');
      return;
    }
    try {
      // Emit qr-cancelled event to notify guards in real-time
      if (qr.requestId) {
        emitQrCancelled(qr.requestId);
      }
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
      const qrData = {
        requestId: res.data.requestId,
        qrDataUrl: res.data.qrDataUrl,
        expiresAt: res.data.expiresAt,
      };
      setQr(qrData);
      // Persist to localStorage so refresh doesn't lose QR
      localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(qrData));
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
            <div className="sa-rejection-icon">{Icons.x}</div>
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

  // If there's an approval, show approval screen
  if (approvalInfo) {
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
          <div className="sa-approval-screen">
            <div className="sa-approval-icon">
              <svg className="sa-icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="9 12 12 15 16 10"></polyline>
              </svg>
            </div>
            <h1 className="sa-approval-title">
              {approvalInfo.direction === 'exit' ? 'Exit Approved!' : 'Entry Approved!'}
            </h1>
            <p className="sa-approval-message">
              Your {approvalInfo.direction} request has been approved by the guard.
            </p>
            <p className="sa-approval-redirect">
              Redirecting to home...
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
          {Icons.arrowLeft} Back
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
                maxLength={30}
              />
            </div>

            <div className="sa-field">
              <label className="sa-label">Enter Place</label>
              <input
                className="sa-input"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g., Market, Hospital, Home"
                maxLength={30}
              />
            </div>

            <button
              className="sa-submit-btn"
              type="button"
              disabled={submitting}
              onClick={doApply}
            >
              {submitting ? 'Generating...' : <>{Icons.doorExit} Generate Exit QR</>}
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
              {submitting ? 'Generating...' : <>{Icons.doorEntry} Generate Entry QR</>}
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
                  {Icons.clock} QR expired. Please apply again.
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
