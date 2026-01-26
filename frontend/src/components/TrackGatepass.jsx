import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getMyGatepasses,
    getMyOutstationGatepasses,
    applyGatepassExit,
    applyGatepassEntry,
    applyOSGatepassExit,
    applyOSGatepassEntry,
    cancelGate,
    deleteLocalGatepass,
    deleteOutstationGatepass,
} from '../api/api';
import PopupBox from './PopupBox';
import '../styles/student-dashboard.css';

// Professional SVG Icons
const Icons = {
    // Home/Local icon
    home: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
    // Plane/Outstation icon
    plane: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>,
    // Door/Exit icon
    doorExit: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    // Door/Entry icon
    doorEntry: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>,
    // Trash/Withdraw icon
    trash: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>,
    // Clock/Time icon
    clock: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    // File/Details icon
    fileText: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
    // Location/Pin icon
    mapPin: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
    // Calendar icon
    calendar: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
    // Phone/Contact icon
    phone: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
    // Clipboard/Status icon
    clipboard: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>,
    // X/Close/Reject icon
    x: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    // Check icon
    check: <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    // Arrow Left/Back icon
    arrowLeft: <svg className="tg-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
};

// Gatepass Details Popup Component
const GatepassDetailsPopup = ({ gatepass, type, onClose, formatDate, formatTime12hr }) => {
    if (!gatepass) return null;

    const isLocal = type === 'local';

    return (
        <div className="tg-details-overlay" onClick={onClose}>
            <div className="tg-details-popup" onClick={(e) => e.stopPropagation()}>
                <button className="tg-details-close" onClick={onClose}>✕</button>
                <div className="tg-details-scroll">
                    <h2 className="tg-details-title">
                        {isLocal ? <>{Icons.home} Local Gatepass</> : <>{Icons.plane} Outstation Gatepass</>}
                    </h2>
                    
                    <div className="tg-details-badge-row">
                        <span className="tg-details-gpno">{gatepass.gatePassNo || '--'}</span>
                        <span className={`tg-details-status ${isLocal ? gatepass.status : (gatepass.finalStatus || 'pending')}`}>
                            {(isLocal ? gatepass.status : gatepass.finalStatus)?.toUpperCase() || 'PENDING'}
                        </span>
                    </div>

                    <div className="tg-details-section">
                        <h3>{Icons.mapPin} Location & Purpose</h3>
                        <div className="tg-details-grid">
                            <div className="tg-details-item">
                                <span className="tg-details-label">Place</span>
                                <span className="tg-details-value">{isLocal ? (gatepass.place || '--') : (gatepass.address || '--')}</span>
                            </div>
                            <div className="tg-details-item">
                                <span className="tg-details-label">{isLocal ? 'Purpose' : 'Reason of Leave'}</span>
                                <span className="tg-details-value">{isLocal ? gatepass.purpose : gatepass.reasonOfLeave}</span>
                            </div>
                        </div>
                    </div>

                    <div className="tg-details-section">
                        <h3>{Icons.calendar} Schedule</h3>
                        <div className="tg-details-grid">
                            <div className="tg-details-item">
                                <span className="tg-details-label">Exit Date</span>
                                <span className="tg-details-value">{formatDate(gatepass.dateOut)}</span>
                            </div>
                            <div className="tg-details-item">
                                <span className="tg-details-label">Exit Time</span>
                                <span className="tg-details-value">{formatTime12hr(gatepass.timeOut)}</span>
                            </div>
                            <div className="tg-details-item">
                                <span className="tg-details-label">Return Date</span>
                                <span className="tg-details-value">{formatDate(gatepass.dateIn)}</span>
                            </div>
                            <div className="tg-details-item">
                                <span className="tg-details-label">Return Time</span>
                                <span className="tg-details-value">{formatTime12hr(gatepass.timeIn)}</span>
                            </div>
                            {!isLocal && gatepass.leaveDays && (
                                <div className="tg-details-item full-width">
                                    <span className="tg-details-label">Total Leave Days</span>
                                    <span className="tg-details-value highlight">{gatepass.leaveDays} day(s)</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Outstation specific: Contact */}
                    {!isLocal && (
                        <div className="tg-details-section">
                            <h3>{Icons.phone} Contact</h3>
                            <div className="tg-details-grid">
                                {gatepass.contact && (
                                    <div className="tg-details-item">
                                        <span className="tg-details-label">Contact Number</span>
                                        <span className="tg-details-value">{gatepass.contact}</span>
                                    </div>
                                )}
                                {gatepass.parentContactNo && (
                                    <div className="tg-details-item">
                                        <span className="tg-details-label">Parent Contact</span>
                                        <span className="tg-details-value">{gatepass.parentContactNo}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actual Exit/Entry Times */}
                    {(gatepass.actualExitAt || gatepass.actualEntryAt) && (
                        <div className="tg-details-section">
                            <h3>{Icons.clock} Actual Timings</h3>
                            <div className="tg-details-grid">
                                {gatepass.actualExitAt && (
                                    <div className="tg-details-item">
                                        <span className="tg-details-label">Actual Exit</span>
                                        <span className="tg-details-value">{(() => { const d = new Date(gatepass.actualExitAt); const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); return `${datePart}, ${timePart}`; })()}</span>
                                    </div>
                                )}
                                {gatepass.actualEntryAt && (
                                    <div className="tg-details-item">
                                        <span className="tg-details-label">Actual Entry</span>
                                        <span className="tg-details-value">{(() => { const d = new Date(gatepass.actualEntryAt); const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); return `${datePart}, ${timePart}`; })()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Status Info */}
                    <div className="tg-details-section">
                        <h3>{Icons.clipboard} Status Info</h3>
                        <div className="tg-details-grid">
                            <div className="tg-details-item">
                                <span className="tg-details-label">Applied On</span>
                                <span className="tg-details-value">{(() => { const d = new Date(gatepass.createdAt); const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); const timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); return `${datePart}, ${timePart}`; })()}</span>
                            </div>
                            <div className="tg-details-item">
                                <span className="tg-details-label">Utilized</span>
                                <span className="tg-details-value">{gatepass.utilized ? 'Yes ✓' : 'No'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason */}
                    {((isLocal && gatepass.status === 'denied') || (!isLocal && gatepass.finalStatus === 'rejected')) && (
                        <div className="tg-details-section rejection">
                            <h3>{Icons.x} Rejection Details</h3>
                            <div className="tg-details-rejection-box">
                                {gatepass.rejectionReason || gatepass.denialReason || 'No reason provided'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TrackGatepass = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('local');
    const [localGatepasses, setLocalGatepasses] = useState([]);
    const [outstationGatepasses, setOutstationGatepasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [popupMessage, setPopupMessage] = useState('');

    const [presence, setPresence] = useState('inside');
    const [localActiveGPNo, setLocalActiveGPNo] = useState(null);
    const [OSActiveGPNo, setOSActiveGPNo] = useState(null);

    const [qrData, setQrData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [deleteState, setDeleteState] = useState({ id: null, type: null });

    // View Details popup state
    const [detailsPopup, setDetailsPopup] = useState({ show: false, gatepass: null, type: null });

    // Rejection state for gatepass QR
    const [rejectionInfo, setRejectionInfo] = useState(null);

    const fetchGatepasses = async () => {
        // Don't fetch if rejection is being shown (will redirect soon)
        if (rejectionInfo) return;

        try {
            // Only show error if not polling with QR active
            if (!qrData) setError('');
            
            const [localRes, osRes] = await Promise.all([getMyGatepasses(), getMyOutstationGatepasses()]);
            setLocalGatepasses(localRes.data.gatepasses || []);
            setOutstationGatepasses(osRes.data.gatepasses || []);
            setPresence(osRes.data.presence || localRes.data.presence || 'inside');
            setLocalActiveGPNo(localRes.data.localActiveGPNo || null);
            setOSActiveGPNo(osRes.data.OSActiveGPNo || null);
            setError(''); // Clear any previous errors on success

            // Check for rejection when QR is active
            if (qrData) {
                const rejection = localRes.data.recentRejection || osRes.data.recentRejection;
                if (rejection) {
                    setQrData(null);
                    setRejectionInfo(rejection);
                    // Auto-redirect after 3 seconds
                    setTimeout(() => {
                        navigate('/student');
                    }, 3000);
                    return; // Stop further processing
                }
            }
        } catch (err) {
            // Only set error if not actively polling with QR and not showing rejection
            // During QR polling, silently ignore network errors to avoid crashing the UI
            if (!qrData && !rejectionInfo) {
                setError(err?.response?.data?.message || 'Failed to fetch gatepasses');
            }
            // If there's a serious auth error (401), still navigate away
            if (err?.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGatepasses();
        // Don't poll if rejection is being shown
        if (rejectionInfo) return;
        const pollInterval = qrData ? 800 : 5000;
        const interval = setInterval(fetchGatepasses, pollInterval);
        return () => clearInterval(interval);
    }, [qrData, rejectionInfo]);

    useEffect(() => {
        if (!qrData?.expiresAt) return;
        const updateCountdown = () => {
            const remaining = Math.max(0, Math.floor((new Date(qrData.expiresAt) - Date.now()) / 1000));
            setCountdown(remaining);
            if (remaining <= 0) setQrData(null);
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [qrData]);

    useEffect(() => {
        if (!qrData) return;
        if (qrData.direction === 'exit' && presence === 'outside') {
            setQrData(null);
            setPopupMessage('Exit approved!');
            fetchGatepasses();
        }
        if (qrData.direction === 'entry' && presence === 'inside') {
            setQrData(null);
            setPopupMessage('Entry approved!');
            fetchGatepasses();
        }
    }, [presence, qrData]);

    // Handle browser back button when QR is active
    useEffect(() => {
        if (!qrData) return;
        const handlePopState = (e) => {
            e.preventDefault();
            window.history.pushState(null, '', window.location.pathname);
            setShowConfirmModal(true);
        };
        window.history.pushState(null, '', window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [qrData]);

    const handleGenerateExitQR = async (gatepassId) => {
        setQrLoading(true);
        try {
            const res = await applyGatepassExit({ gatepassId });
            setQrData({ qrDataUrl: res.data.qrDataUrl, expiresAt: res.data.expiresAt, gatePassNo: res.data.gatePassNo, direction: 'exit' });
        } catch (err) {
            setPopupMessage(err?.response?.data?.message || 'Failed to generate QR');
        } finally {
            setQrLoading(false);
        }
    };

    const handleGenerateEntryQR = async (gatepassId) => {
        setQrLoading(true);
        try {
            const res = await applyGatepassEntry({ gatepassId });
            setQrData({ qrDataUrl: res.data.qrDataUrl, expiresAt: res.data.expiresAt, gatePassNo: res.data.gatePassNo, direction: 'entry' });
        } catch (err) {
            setPopupMessage(err?.response?.data?.message || 'Failed to generate QR');
        } finally {
            setQrLoading(false);
        }
    };

    const handleOSExitQR = async (gatepassId) => {
        setQrLoading(true);
        try {
            const res = await applyOSGatepassExit({ gatepassId });
            setQrData({ qrDataUrl: res.data.qrDataUrl, expiresAt: res.data.expiresAt, gatePassNo: res.data.gatePassNo, direction: 'exit' });
        } catch (err) {
            setPopupMessage(err?.response?.data?.message || 'Failed to generate QR');
        } finally {
            setQrLoading(false);
        }
    };

    const handleOSEntryQR = async (gatepassId) => {
        setQrLoading(true);
        try {
            const res = await applyOSGatepassEntry({ gatepassId });
            setQrData({ qrDataUrl: res.data.qrDataUrl, expiresAt: res.data.expiresAt, gatePassNo: res.data.gatePassNo, direction: 'entry' });
        } catch (err) {
            setPopupMessage(err?.response?.data?.message || 'Failed to generate QR');
        } finally {
            setQrLoading(false);
        }
    };

    const handleDismissQR = async () => {
        try {
            await cancelGate();
            setQrData(null);
            setShowConfirmModal(false);
        } catch (err) {
            setPopupMessage(err?.response?.data?.message || 'Failed to dismiss');
        }
    };

    const handleWithdrawLocal = async (gatepassId) => {
        const confirmed = window.confirm('Withdraw this local gatepass request?');
        if (!confirmed) return;
        setDeleteState({ id: gatepassId, type: 'local' });
        try {
            await deleteLocalGatepass(gatepassId);
            setPopupMessage('Local gatepass request withdrawn.');
            fetchGatepasses();
        } catch (err) {
            setPopupMessage(err?.response?.data?.message || 'Failed to withdraw local gatepass.');
        } finally {
            setDeleteState({ id: null, type: null });
        }
    };

    const handleWithdrawOutstation = async (gatepassId) => {
        const confirmed = window.confirm('Withdraw this outstation gatepass request?');
        if (!confirmed) return;
        setDeleteState({ id: gatepassId, type: 'outstation' });
        try {
            await deleteOutstationGatepass(gatepassId);
            setPopupMessage('Outstation gatepass request withdrawn.');
            fetchGatepasses();
        } catch (err) {
            setPopupMessage(err?.response?.data?.message || 'Failed to withdraw outstation gatepass.');
        } finally {
            setDeleteState({ id: null, type: null });
        }
    };

    const handleBackClick = () => {
        if (qrData) {
            setShowConfirmModal(true);
        } else {
            navigate('/student');
        }
    };

    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
    };
    const formatTime12hr = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let hours = parseInt(parts[0], 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${parts[1]} ${ampm}`;
    };

    // If there's a rejection, show rejection screen
    if (rejectionInfo) {
        return (
            <div className="sd-shell">
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
                        {rejectionInfo.gatePassNo && (
                            <p className="sa-rejection-gatepass">
                                Gatepass: {rejectionInfo.gatePassNo}
                            </p>
                        )}
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
            <header className="sd-header">
                <div className="sd-header-brand">
                    <span className="sd-logo">GoThru</span>
                    <span className="sd-logo-sub">by Watchr</span>
                </div>
                <button className="sa-back-btn" onClick={handleBackClick}>{Icons.arrowLeft} Back</button>
            </header>

            <main className="sd-main tg-main">
                {/* QR Display - Full Screen Style (hides everything else) */}
                {qrData ? (
                    <>
                        <div className="sa-qr-title">{qrData.direction === 'exit' ? 'Exit' : 'Entry'} QR Generated</div>
                        <div className="sa-qr-card">
                            <div className="sa-qr-label">SHOW THIS QR TO THE GUARD</div>
                            <img src={qrData.qrDataUrl} alt="QR" className="sa-qr-img" />
                            <div className="sa-qr-timer">Expires in <span className="sa-qr-time">{formatTime(countdown)}</span></div>
                        </div>
                        <button className="sa-cancel-btn" onClick={() => setShowConfirmModal(true)}>
                            {qrData.direction === 'exit' ? 'Not going outside? Cancel' : 'Not going inside? Cancel'}
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="tg-title">Gatepass Status</h1>

                        {/* Tabs */}
                        <div className="tg-tabs">
                            <button className={`tg-tab ${activeTab === 'local' ? 'active' : ''}`} onClick={() => setActiveTab('local')}>
                                {Icons.home} Local
                            </button>
                            <button className={`tg-tab ${activeTab === 'outstation' ? 'active' : ''}`} onClick={() => setActiveTab('outstation')}>
                                {Icons.plane} Outstation
                            </button>
                        </div>

                        {loading && <p className="tg-loading">Loading gatepasses...</p>}
                        {error && <p className="tg-error">{error}</p>}

                        {/* Local Gatepasses Tab */}
                        {activeTab === 'local' && (
                            <LocalGatepassList
                                gatepasses={localGatepasses}
                                presence={presence}
                                localActiveGPNo={localActiveGPNo}
                                qrData={qrData}
                                qrLoading={qrLoading}
                                deleteState={deleteState}
                                onExitQR={handleGenerateExitQR}
                                onEntryQR={handleGenerateEntryQR}
                                onWithdraw={handleWithdrawLocal}
                                formatDate={formatDate}
                                formatTime12hr={formatTime12hr}
                                onViewDetails={(gp) => setDetailsPopup({ show: true, gatepass: gp, type: 'local' })}
                            />
                        )}

                        {/* Outstation Gatepasses Tab */}
                        {activeTab === 'outstation' && (
                            <OutstationGatepassList
                                gatepasses={outstationGatepasses}
                                presence={presence}
                                OSActiveGPNo={OSActiveGPNo}
                                qrData={qrData}
                                qrLoading={qrLoading}
                                deleteState={deleteState}
                                onExitQR={handleOSExitQR}
                                onEntryQR={handleOSEntryQR}
                                onWithdraw={handleWithdrawOutstation}
                                formatDate={formatDate}
                                formatTime12hr={formatTime12hr}
                                onShowPopup={setPopupMessage}
                                onViewDetails={(gp) => setDetailsPopup({ show: true, gatepass: gp, type: 'outstation' })}
                            />
                        )}
                    </>
                )}

                <PopupBox message={popupMessage} onClose={() => setPopupMessage('')} />

                {/* Gatepass Details Popup */}
                {detailsPopup.show && (
                    <GatepassDetailsPopup
                        gatepass={detailsPopup.gatepass}
                        type={detailsPopup.type}
                        onClose={() => setDetailsPopup({ show: false, gatepass: null, type: null })}
                        formatDate={formatDate}
                        formatTime12hr={formatTime12hr}
                    />
                )}
            </main>

            <div className="sd-footer">GoThru v1.1 • RGIPT Campus Access System</div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="sd-modal-overlay">
                    <div className="sa-confirm-modal">
                        <div className="sa-confirm-title">Cancel QR?</div>
                        <p className="sa-confirm-text">
                            Don't worry! Your gatepass won't be discarded. You can generate a new QR anytime within your gatepass validity period.
                        </p>
                        <div className="sa-confirm-btns">
                            <button className="sa-confirm-yes" onClick={handleDismissQR}>Yes, Cancel QR</button>
                            <button className="sa-confirm-no" onClick={() => setShowConfirmModal(false)}>No, Keep QR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LocalGatepassList = ({ gatepasses, presence, localActiveGPNo, qrData, qrLoading, deleteState, onExitQR, onEntryQR, onWithdraw, formatDate, formatTime12hr, onViewDetails }) => {
    const hasGatepassExpired = (gp) => {
        if (!gp.dateIn || !gp.timeIn) return false;
        try {
            const inDate = new Date(gp.dateIn);
            const timeParts = gp.timeIn.split(':');
            inDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
            return Date.now() > inDate.getTime();
        } catch { return false; }
    };

    // Check if exit is allowed (within 15 minutes of scheduled exit time)
    const getExitTimeInfo = (gp) => {
        if (!gp.dateOut || !gp.timeOut) return { canExit: true, availableAt: null };
        try {
            const outDate = new Date(gp.dateOut);
            const timeParts = gp.timeOut.split(':');
            outDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
            
            // Calculate 15 minutes before exit time
            const allowedTime = new Date(outDate.getTime() - 15 * 60 * 1000);
            const now = Date.now();
            
            if (now >= allowedTime.getTime()) {
                return { canExit: true, availableAt: null };
            }
            
            // Format available time for display
            let hours = allowedTime.getHours();
            const mins = String(allowedTime.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            const availableAt = `${hours}:${mins} ${ampm}`;
            
            return { canExit: false, availableAt };
        } catch { return { canExit: true, availableAt: null }; }
    };

    const getGatepassAction = (gp) => {
        if (gp.status !== 'approved') return null;
        if (gp.utilized) return 'utilized';
        if (hasGatepassExpired(gp)) return 'expired';
        // If student is outside with this gatepass, show entry button
        if (presence === 'outside' && localActiveGPNo === gp.gatePassNo) return 'entry';
        // Otherwise show exit button (for approved, non-utilized, non-expired gatepasses)
        return 'exit';
    };

    if (gatepasses.length === 0) return <p className="tg-empty">No local gatepasses found</p>;

    return (
        <div className="tg-list">
            {gatepasses.map((gp) => {
                const action = getGatepassAction(gp);
                const statusClass = gp.status === 'approved' ? 'approved' : gp.status === 'denied' ? 'denied' : 'pending';
                const canWithdraw = gp.status === 'pending' && !qrData;
                const isDeleting = deleteState?.type === 'local' && deleteState?.id === gp._id;
                const exitTimeInfo = action === 'exit' ? getExitTimeInfo(gp) : { canExit: true, availableAt: null };
                return (
                    <div key={gp._id} className={`tg-card ${statusClass}`}>
                        <div className="tg-card-header">
                            <div>
                                <div className="tg-card-id">{gp.gatePassNo}</div>
                                <div className="tg-card-place">{gp.place}</div>
                            </div>
                            <span className={`tg-status-badge ${statusClass}`}>{gp.status.toUpperCase()}</span>
                        </div>
                        <div className="tg-card-dates">
                            <div><b>Out:</b> {formatDate(gp.dateOut)} {formatTime12hr(gp.timeOut)}</div>
                            <div><b>In:</b> {formatDate(gp.dateIn)} {formatTime12hr(gp.timeIn)}</div>
                        </div>
                        {action === 'exit' && !qrData && exitTimeInfo.canExit && (
                            <button className="tg-action-btn exit" onClick={() => onExitQR(gp._id)} disabled={qrLoading}>
                                {qrLoading ? 'Generating...' : <>{Icons.doorExit} Generate Exit QR</>}
                            </button>
                        )}
                        {action === 'exit' && !qrData && !exitTimeInfo.canExit && (
                            <div className="tg-exit-wait-notice">
                                <span className="tg-wait-icon">{Icons.clock}</span>
                                <span>Exit QR available at <b>{exitTimeInfo.availableAt}</b></span>
                                <span className="tg-wait-subtext">(15 min before scheduled exit)</span>
                            </div>
                        )}
                        {action === 'entry' && !qrData && (
                            <button className="tg-action-btn entry" onClick={() => onEntryQR(gp._id)} disabled={qrLoading}>
                                {qrLoading ? 'Generating...' : <>{Icons.doorEntry} Generate Entry QR</>}
                            </button>
                        )}
                        {canWithdraw && (
                            <button className="tg-action-btn withdraw" onClick={() => onWithdraw(gp._id)} disabled={isDeleting}>
                                {isDeleting ? 'Withdrawing...' : <>{Icons.trash} Withdraw Request</>}
                            </button>
                        )}
                        {action === 'utilized' && <div className="tg-utilized"><svg className="tg-utilized-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Gatepass Utilized</div>}
                        {action === 'expired' && <div className="tg-expired-badge">{Icons.clock} Gatepass Expired</div>}
                        <button className="tg-view-details-btn" onClick={() => onViewDetails(gp)}>
                            {Icons.fileText} View Details
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

const OutstationGatepassList = ({ gatepasses, presence, OSActiveGPNo, qrData, qrLoading, deleteState, onExitQR, onEntryQR, onWithdraw, formatDate, formatTime12hr, onShowPopup, onViewDetails }) => {
    if (gatepasses.length === 0) return <p className="tg-empty">No outstation gatepasses found</p>;

    return (
        <div className="tg-list">
            {gatepasses.map((gp) => (
                <OutstationGatepassCard
                    key={gp._id}
                    gp={gp}
                    presence={presence}
                    OSActiveGPNo={OSActiveGPNo}
                    qrData={qrData}
                    qrLoading={qrLoading}
                    deleteState={deleteState}
                    onExitQR={onExitQR}
                    onEntryQR={onEntryQR}
                    onWithdraw={onWithdraw}
                    formatDate={formatDate}
                    formatTime12hr={formatTime12hr}
                    onShowPopup={onShowPopup}
                    onViewDetails={onViewDetails}
                />
            ))}
        </div>
    );
};

const OutstationGatepassCard = ({ gp, presence, OSActiveGPNo, qrData, qrLoading, deleteState, onExitQR, onEntryQR, onWithdraw, formatDate, formatTime12hr, onShowPopup, onViewDetails }) => {
    // Check if student is PhD
    const isPhD = gp.course === 'PhD';
    
    // Stage order differs for PhD vs BTech/MBA
    const stageOrderPhD = ['instructor', 'officeSecretary', 'dpgc', 'hod', 'dean', 'hostelOffice'];
    const stageOrderBTech = ['officeSecretary', 'dugc', 'hod', 'hostelOffice'];
    const stageOrder = isPhD ? stageOrderPhD : stageOrderBTech;

    // Check if any previous stage was rejected
    function isRejectedBefore(gp, stage) {
        const stageIdx = stageOrder.indexOf(stage);
        for (let i = 0; i < stageIdx; i++) {
            if (gp.stageStatus?.[stageOrder[i]]?.status === 'rejected') {
                return true;
            }
        }
        return false;
    }

    function getStageStatus(gp, stage) {
        // If any previous stage was rejected, this stage is not applicable
        if (isRejectedBefore(gp, stage)) return 'not-applicable';
        
        const stageData = gp.stageStatus?.[stage];
        if (stageData?.status === 'approved') return 'approved';
        if (stageData?.status === 'rejected') return 'rejected';
        if (gp.currentStage === stage) return 'current';
        const fullStageOrder = [...stageOrder, 'completed'];
        const currentIdx = fullStageOrder.indexOf(gp.currentStage);
        const stageIdx = fullStageOrder.indexOf(stage);
        if (currentIdx > stageIdx) return 'completed';
        return 'pending';
    }

    // Different stages for PhD vs BTech/MBA
    const stages = isPhD 
        ? [
            { id: 'applied', label: 'Applied', status: 'completed' },
            { id: 'instructor', label: 'Instructor', status: getStageStatus(gp, 'instructor') },
            { id: 'officeSecretary', label: 'Secretary', status: getStageStatus(gp, 'officeSecretary') },
            { id: 'dpgc', label: 'DPGC', status: getStageStatus(gp, 'dpgc') },
            { id: 'hod', label: 'HOD', status: getStageStatus(gp, 'hod') },
            { id: 'dean', label: 'Dean', status: getStageStatus(gp, 'dean') },
            { id: 'hostelOffice', label: 'Hostel', status: getStageStatus(gp, 'hostelOffice') },
        ]
        : [
            { id: 'applied', label: 'Applied', status: 'completed' },
            { id: 'officeSecretary', label: 'Secretary', status: getStageStatus(gp, 'officeSecretary') },
            { id: 'dugc', label: 'DUGC', status: getStageStatus(gp, 'dugc') },
            { id: 'hod', label: 'HOD', status: getStageStatus(gp, 'hod') },
            { id: 'hostelOffice', label: 'Hostel', status: getStageStatus(gp, 'hostelOffice') },
        ];

    const isRejected = gp.finalStatus === 'rejected';
    const isApproved = gp.finalStatus === 'approved';

    const getOSAction = () => {
        if (!isApproved) return null;
        if (gp.utilized) return 'utilized';
        const inDateTime = new Date(`${gp.dateIn}T${gp.timeIn}`);
        const hasInTimePassed = Date.now() > inDateTime.getTime();
        if (hasInTimePassed) return 'expired';
        // If student is outside with this gatepass, show entry button
        if (presence === 'outside' && OSActiveGPNo === gp.gatePassNo) return 'entry';
        // Otherwise show exit button (for approved, non-utilized, non-expired gatepasses)
        return 'exit';
    };

    const handleExitClick = () => {
        if (presence === 'outside') {
            onShowPopup('You are already out of campus');
        } else {
            onExitQR(gp._id);
        }
    };

    const action = getOSAction();
    const cardClass = isRejected ? 'denied' : isApproved ? 'approved' : 'pending';
    const canWithdraw = gp.finalStatus === 'pending' && !qrData;
    const isDeleting = deleteState?.type === 'outstation' && deleteState?.id === gp._id;

    // Find rejection reason if rejected
    const getRejectionInfo = () => {
        if (!isRejected) return null;
        if (gp.rejectionReason) return { reason: gp.rejectionReason, by: gp.rejectedBy?.stage };
        // Check each stage for rejection (use the appropriate stage order)
        for (const stage of stageOrder) {
            if (gp.stageStatus?.[stage]?.status === 'rejected') {
                return { reason: gp.stageStatus[stage].rejectionReason, by: stage };
            }
        }
        return null;
    };
    const rejectionInfo = getRejectionInfo();

    // Helper function to get stage display name
    const getStageDisplayName = (stage) => {
        const stageNames = {
            instructor: 'Instructor',
            officeSecretary: 'Office Secretary',
            dpgc: 'DPGC',
            dugc: 'DUGC',
            hod: 'HOD',
            dean: 'Dean',
            hostelOffice: 'Hostel Office'
        };
        return stageNames[stage] || 'Authority';
    };

    return (
        <div className={`tg-card os-card ${cardClass}`}>
            {gp.gatePassNo && <div className="tg-os-badge">{gp.gatePassNo}</div>}
            <div className="tg-os-reason">{gp.reasonOfLeave}</div>

            <div className="tg-card-dates">
                <div><b>Out:</b> {formatDate(gp.dateOut)} at {formatTime12hr(gp.timeOut)}</div>
                <div><b>In:</b> {formatDate(gp.dateIn)} at {formatTime12hr(gp.timeIn)}</div>
                <div><b>Leave Days:</b> {gp.leaveDays}</div>
            </div>

            <ProgressTracker stages={stages} />

            {/* Rejection Reason Display */}
            {isRejected && rejectionInfo?.reason && (
                <div className="gatepass-rejection-reason">
                    <div className="rejection-label">
                        Rejected by {getStageDisplayName(rejectionInfo.by)}
                    </div>
                    <div className="rejection-text">{rejectionInfo.reason}</div>
                </div>
            )}

            {action === 'exit' && !qrData && (
                <button className="tg-action-btn exit" onClick={handleExitClick} disabled={qrLoading}>
                    {qrLoading ? 'Generating...' : <>{Icons.doorExit} Generate Exit QR</>}
                </button>
            )}
            {action === 'entry' && !qrData && (
                <button className="tg-action-btn entry" onClick={() => onEntryQR(gp._id)} disabled={qrLoading}>
                    {qrLoading ? 'Generating...' : <>{Icons.doorEntry} Generate Entry QR</>}
                </button>
            )}
            {canWithdraw && (
                <button className="tg-action-btn withdraw" onClick={() => onWithdraw(gp._id)} disabled={isDeleting}>
                    {isDeleting ? 'Withdrawing...' : <>{Icons.trash} Withdraw Request</>}
                </button>
            )}
            {action === 'utilized' && <div className="tg-utilized"><svg className="tg-utilized-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Gatepass Utilized</div>}
            {action === 'expired' && <div className="tg-expired-badge">{Icons.clock} Gatepass Expired</div>}
            <button className="tg-view-details-btn" onClick={() => onViewDetails(gp)}>
                {Icons.fileText} View Details
            </button>
        </div>
    );
};

const ProgressTracker = ({ stages }) => {
    return (
        <div className="tg-progress">
            <div className="tg-progress-line"></div>
            {stages.map((stage) => {
                let nodeClass = 'pending';
                let icon = '';
                let statusLabel = '';
                if (stage.status === 'completed' || stage.status === 'approved') { nodeClass = 'completed'; icon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>; }
                else if (stage.status === 'rejected') { nodeClass = 'rejected'; icon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>; statusLabel = 'rejected'; }
                else if (stage.status === 'not-applicable') { nodeClass = 'not-applicable'; icon = '!'; }
                else if (stage.status === 'current') { nodeClass = 'current'; icon = '●'; statusLabel = 'waiting'; }
                else if (stage.status === 'pending') { statusLabel = ''; } // future stages, no label

                return (
                    <div key={stage.id} className="tg-progress-step">
                        {statusLabel && <div className={`tg-progress-status ${nodeClass}`}>{statusLabel}</div>}
                        <div className={`tg-progress-node ${nodeClass}`}>{icon}</div>
                        <div className={`tg-progress-label ${nodeClass}`}>{stage.label}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default TrackGatepass;
