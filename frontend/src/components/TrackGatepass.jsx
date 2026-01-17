import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyGatepasses, getMyOutstationGatepasses, applyGatepassExit, applyGatepassEntry, applyOSGatepassExit, applyOSGatepassEntry, cancelGate } from '../api/api';
import PopupBox from './PopupBox';
import '../styles/student-dashboard.css';

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

    const fetchGatepasses = async () => {
        try {
            setError('');
            const [localRes, osRes] = await Promise.all([getMyGatepasses(), getMyOutstationGatepasses()]);
            setLocalGatepasses(localRes.data.gatepasses || []);
            setOutstationGatepasses(osRes.data.gatepasses || []);
            setPresence(osRes.data.presence || localRes.data.presence || 'inside');
            setLocalActiveGPNo(localRes.data.localActiveGPNo || null);
            setOSActiveGPNo(osRes.data.OSActiveGPNo || null);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch gatepasses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGatepasses();
        const pollInterval = qrData ? 800 : 5000;
        const interval = setInterval(fetchGatepasses, pollInterval);
        return () => clearInterval(interval);
    }, [qrData]);

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

    return (
        <div className="sd-shell">
            <header className="sd-header">
                <div className="sd-header-brand">
                    <span className="sd-logo">GoThru</span>
                    <span className="sd-logo-sub">by Watchr</span>
                </div>
                <button className="sa-back-btn" onClick={handleBackClick}>Back →</button>
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
                                🏠 Local
                            </button>
                            <button className={`tg-tab ${activeTab === 'outstation' ? 'active' : ''}`} onClick={() => setActiveTab('outstation')}>
                                ✈️ Outstation
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
                                onExitQR={handleGenerateExitQR}
                                onEntryQR={handleGenerateEntryQR}
                                formatDate={formatDate}
                                formatTime12hr={formatTime12hr}
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
                                onExitQR={handleOSExitQR}
                                onEntryQR={handleOSEntryQR}
                                formatDate={formatDate}
                                formatTime12hr={formatTime12hr}
                                onShowPopup={setPopupMessage}
                            />
                        )}
                    </>
                )}

                <PopupBox message={popupMessage} onClose={() => setPopupMessage('')} />
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

const LocalGatepassList = ({ gatepasses, presence, localActiveGPNo, qrData, qrLoading, onExitQR, onEntryQR, formatDate, formatTime12hr }) => {
    const hasGatepassExpired = (gp) => {
        if (!gp.dateIn || !gp.timeIn) return false;
        try {
            const inDate = new Date(gp.dateIn);
            const timeParts = gp.timeIn.split(':');
            inDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
            return Date.now() > inDate.getTime();
        } catch { return false; }
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
                        {action === 'exit' && !qrData && (
                            <button className="tg-action-btn exit" onClick={() => onExitQR(gp._id)} disabled={qrLoading}>
                                {qrLoading ? 'Generating...' : '🚪 Generate Exit QR'}
                            </button>
                        )}
                        {action === 'entry' && !qrData && (
                            <button className="tg-action-btn entry" onClick={() => onEntryQR(gp._id)} disabled={qrLoading}>
                                {qrLoading ? 'Generating...' : '🏠 Generate Entry QR'}
                            </button>
                        )}
                        {action === 'utilized' && <div className="tg-utilized">✓ Gatepass Utilized</div>}
                        {action === 'expired' && <div className="tg-expired-badge">⏰ Gatepass Expired</div>}
                    </div>
                );
            })}
        </div>
    );
};

const OutstationGatepassList = ({ gatepasses, presence, OSActiveGPNo, qrData, qrLoading, onExitQR, onEntryQR, formatDate, formatTime12hr, onShowPopup }) => {
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
                    onExitQR={onExitQR}
                    onEntryQR={onEntryQR}
                    formatDate={formatDate}
                    formatTime12hr={formatTime12hr}
                    onShowPopup={onShowPopup}
                />
            ))}
        </div>
    );
};

const OutstationGatepassCard = ({ gp, presence, OSActiveGPNo, qrData, qrLoading, onExitQR, onEntryQR, formatDate, formatTime12hr, onShowPopup }) => {
    // Check if any previous stage was rejected
    function isRejectedBefore(gp, stage) {
        const stageOrder = ['officeSecretary', 'dugc', 'hod', 'hostelOffice'];
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
        const stageOrder = ['officeSecretary', 'dugc', 'hod', 'hostelOffice', 'completed'];
        const currentIdx = stageOrder.indexOf(gp.currentStage);
        const stageIdx = stageOrder.indexOf(stage);
        if (currentIdx > stageIdx) return 'completed';
        return 'pending';
    }

    const stages = [
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

            {action === 'exit' && !qrData && (
                <button className="tg-action-btn exit" onClick={handleExitClick} disabled={qrLoading}>
                    {qrLoading ? 'Generating...' : '🚪 Generate Exit QR'}
                </button>
            )}
            {action === 'entry' && !qrData && (
                <button className="tg-action-btn entry" onClick={() => onEntryQR(gp._id)} disabled={qrLoading}>
                    {qrLoading ? 'Generating...' : '🏠 Generate Entry QR'}
                </button>
            )}
            {action === 'utilized' && <div className="tg-utilized">✓ Gatepass Utilized</div>}
            {action === 'expired' && <div className="tg-expired-badge">⏰ Gatepass Expired</div>}
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
                if (stage.status === 'completed' || stage.status === 'approved') { nodeClass = 'completed'; icon = '✓'; }
                else if (stage.status === 'rejected') { nodeClass = 'rejected'; icon = '✗'; statusLabel = 'rejected'; }
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
