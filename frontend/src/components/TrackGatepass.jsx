import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyGatepasses, getMyOutstationGatepasses, applyGatepassExit, applyGatepassEntry, applyOSGatepassExit, applyOSGatepassEntry, cancelGate } from '../api/api';
import PopupBox from './PopupBox';
import '../styles/student.css';

const TrackGatepass = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('local');
    const [localGatepasses, setLocalGatepasses] = useState([]);
    const [outstationGatepasses, setOutstationGatepasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [popupMessage, setPopupMessage] = useState('');

    // Student status
    const [presence, setPresence] = useState('inside');
    const [activeGatePassNo, setActiveGatePassNo] = useState(null);

    // QR State
    const [qrData, setQrData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const fetchGatepasses = async () => {
        try {
            setError('');
            const [localRes, osRes] = await Promise.all([
                getMyGatepasses(),
                getMyOutstationGatepasses(),
            ]);
            setLocalGatepasses(localRes.data.gatepasses || []);
            setOutstationGatepasses(osRes.data.gatepasses || []);
            // Use OS presence if available, otherwise use local
            setPresence(osRes.data.presence || localRes.data.presence || 'inside');
            setActiveGatePassNo(osRes.data.activeGatePassNo || localRes.data.activeGatePassNo || null);
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

    // Countdown timer for QR
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

    // Auto-dismiss QR on presence change
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

    // OS Gatepass QR handlers
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
        } catch (err) {
            setPopupMessage(err?.response?.data?.message || 'Failed to dismiss');
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
        <div className="student-shell">
            <header className="student-header">
                <button className="student-back" onClick={() => navigate('/student')}>← Back</button>
                <div>
                    <div className="brand">GoThru</div>
                    <div className="sub">by Watchr</div>
                </div>
            </header>

            <main className="student-main">
                <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Track Gatepass</h2>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
                    <button
                        onClick={() => setActiveTab('local')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '20px',
                            border: 'none',
                            background: activeTab === 'local' ? 'rgba(153, 4, 182, 0.9)' : 'rgba(200,200,200,0.5)',
                            color: activeTab === 'local' ? '#fff' : '#333',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        Local
                    </button>
                    <button
                        onClick={() => setActiveTab('outstation')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '20px',
                            border: 'none',
                            background: activeTab === 'outstation' ? 'rgba(153, 4, 182, 0.9)' : 'rgba(200,200,200,0.5)',
                            color: activeTab === 'outstation' ? '#fff' : '#333',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        Outstation
                    </button>
                </div>

                {loading && <p>Loading gatepasses...</p>}
                {error && <p style={{ color: '#b00020', fontWeight: 600 }}>{error}</p>}

                {/* QR Display */}
                {qrData && (
                    <div className="student-qr-card" style={{ marginBottom: '20px' }}>
                        <div className="student-qr-top">GATEPASS {qrData.direction?.toUpperCase()} QR - {qrData.gatePassNo}</div>
                        <img src={qrData.qrDataUrl} alt="QR" className="student-qr" />
                        <div className="student-timer">Expires in: {formatTime(countdown)}</div>
                        <button className="student-dismiss-btn" onClick={handleDismissQR}>Dismiss</button>
                    </div>
                )}

                {/* Local Gatepasses Tab */}
                {activeTab === 'local' && (
                    <LocalGatepassList
                        gatepasses={localGatepasses}
                        presence={presence}
                        activeGatePassNo={activeGatePassNo}
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
                        activeGatePassNo={activeGatePassNo}
                        qrData={qrData}
                        qrLoading={qrLoading}
                        onExitQR={handleOSExitQR}
                        onEntryQR={handleOSEntryQR}
                        formatDate={formatDate}
                        formatTime12hr={formatTime12hr}
                    />
                )}

                <PopupBox message={popupMessage} onClose={() => setPopupMessage('')} />
            </main>
        </div>
    );
};

// Local Gatepass List (existing functionality)
const LocalGatepassList = ({ gatepasses, presence, activeGatePassNo, qrData, qrLoading, onExitQR, onEntryQR, formatDate, formatTime12hr }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#16a34a';
            case 'denied': return '#dc2626';
            default: return '#f59e0b';
        }
    };

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
        if (presence === 'outside' && activeGatePassNo === gp.gatePassNo) return 'entry';
        if (gp.utilized) return 'expired';
        if (presence === 'inside' && hasGatepassExpired(gp)) return 'expired';
        if (presence === 'inside') return 'exit';
        return null;
    };

    if (gatepasses.length === 0) return <p style={{ opacity: 0.7, textAlign: 'center' }}>No local gatepasses found</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {gatepasses.map((gp) => {
                const action = getGatepassAction(gp);
                return (
                    <div key={gp._id} style={{
                        background: gp.status === 'approved' ? 'rgba(200,240,200,0.9)' : gp.status === 'denied' ? 'rgba(255,200,200,0.9)' : 'rgba(255,240,200,0.9)',
                        borderRadius: '14px', padding: '16px', border: '1px solid rgba(0,0,0,0.12)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '16px' }}>{gp.gatePassNo}</div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>{gp.place}</div>
                            </div>
                            <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, color: '#fff', background: getStatusColor(gp.status) }}>
                                {gp.status.toUpperCase()}
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                            <div><b>Out:</b> {formatDate(gp.dateOut)} {formatTime12hr(gp.timeOut)}</div>
                            <div><b>In:</b> {formatDate(gp.dateIn)} {formatTime12hr(gp.timeIn)}</div>
                        </div>
                        {action === 'exit' && !qrData && (
                            <button onClick={() => onExitQR(gp._id)} disabled={qrLoading} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'rgba(153,4,182,0.9)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                                {qrLoading ? 'Generating...' : 'Generate QR for Exit'}
                            </button>
                        )}
                        {action === 'entry' && !qrData && (
                            <button onClick={() => onEntryQR(gp._id)} disabled={qrLoading} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'rgba(22,163,74,0.9)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                                {qrLoading ? 'Generating...' : 'Generate QR for Entry'}
                            </button>
                        )}
                        {action === 'expired' && (
                            <div style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(100,100,100,0.8)', color: '#fff', fontWeight: 700, textAlign: 'center' }}>✓ Gatepass Utilized</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Outstation Gatepass List with Progress Tracker and QR
const OutstationGatepassList = ({ gatepasses, presence, activeGatePassNo, qrData, qrLoading, onExitQR, onEntryQR, formatDate, formatTime12hr }) => {
    if (gatepasses.length === 0) return <p style={{ opacity: 0.7, textAlign: 'center' }}>No outstation gatepasses found</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {gatepasses.map((gp) => (
                <OutstationGatepassCard
                    key={gp._id}
                    gp={gp}
                    presence={presence}
                    activeGatePassNo={activeGatePassNo}
                    qrData={qrData}
                    qrLoading={qrLoading}
                    onExitQR={onExitQR}
                    onEntryQR={onEntryQR}
                    formatDate={formatDate}
                    formatTime12hr={formatTime12hr}
                />
            ))}
        </div>
    );
};

// Individual OS Gatepass Card with Progress Tracker and QR buttons
const OutstationGatepassCard = ({ gp, presence, activeGatePassNo, qrData, qrLoading, onExitQR, onEntryQR, formatDate, formatTime12hr }) => {
    // Determine stage status
    const stages = [
        { id: 'applied', label: 'Applied', status: 'completed' },
        { id: 'officeSecretary', label: 'Office Secretary', status: getStageStatus(gp, 'officeSecretary') },
        { id: 'dugc', label: 'DUGC', status: getStageStatus(gp, 'dugc') },
        { id: 'hod', label: 'HOD', status: getStageStatus(gp, 'hod') },
    ];

    function getStageStatus(gp, stage) {
        const stageData = gp.stageStatus?.[stage];
        if (stageData?.status === 'approved') return 'approved';
        if (stageData?.status === 'rejected') return 'rejected';
        if (gp.currentStage === stage) return 'current';
        const stageOrder = ['officeSecretary', 'dugc', 'hod', 'completed'];
        const currentIdx = stageOrder.indexOf(gp.currentStage);
        const stageIdx = stageOrder.indexOf(stage);
        if (currentIdx > stageIdx) return 'completed';
        return 'pending';
    }

    const isRejected = gp.finalStatus === 'rejected';
    const isApproved = gp.finalStatus === 'approved';

    // Determine QR action for approved gatepasses
    const getOSAction = () => {
        if (!isApproved) return null;
        if (gp.utilized) return 'utilized';

        // Check if in-time has passed
        const inDateTime = new Date(`${gp.dateIn}T${gp.timeIn}`);
        const hasInTimePassed = Date.now() > inDateTime.getTime();

        // If student is outside with this gatepass active - show entry button (no time limit)
        if (presence === 'outside' && activeGatePassNo === gp.gatePassNo) {
            return 'entry';
        }

        // If student is inside and in-time hasn't passed - show exit button
        if (presence === 'inside' && !hasInTimePassed) {
            return 'exit';
        }

        // If in-time has passed and student is inside, gatepass is expired
        if (presence === 'inside' && hasInTimePassed) {
            return 'expired';
        }

        return null;
    };

    const action = getOSAction();

    return (
        <div style={{
            background: isRejected ? 'rgba(255,200,200,0.9)' : isApproved ? 'rgba(200,240,200,0.9)' : '#fff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
            {/* Header with Gatepass Number */}
            <div style={{ marginBottom: '12px' }}>
                {gp.gatePassNo && (
                    <div style={{
                        display: 'inline-block',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        background: 'rgba(153,4,182,0.15)',
                        color: 'rgba(153,4,182,1)',
                        borderRadius: '6px',
                        marginBottom: '8px',
                    }}>
                        {gp.gatePassNo}
                    </div>
                )}
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{gp.reasonOfLeave}</div>
            </div>

            {/* Details */}
            <div style={{ fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>
                <div><b>Out:</b> {formatDate(gp.dateOut)} at {formatTime12hr(gp.timeOut)}</div>
                <div><b>In:</b> {formatDate(gp.dateIn)} at {formatTime12hr(gp.timeIn)}</div>
                <div><b>Leave Days:</b> {gp.leaveDays} days</div>
            </div>

            {/* Progress Tracker */}
            <div style={{ marginBottom: '16px' }}>
                <ProgressTracker stages={stages} isRejected={isRejected} />
            </div>

            {/* Stage Details */}
            <div style={{ fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: action ? '16px' : '0' }}>
                {stages.slice(1).map((stage) => {
                    const stageData = gp.stageStatus?.[stage.id];
                    if (!stageData?.status || stageData.status === 'pending') return null;
                    return (
                        <div key={stage.id} style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: stageData.status === 'approved' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                            color: stageData.status === 'approved' ? '#16a34a' : '#dc2626',
                        }}>
                            {stage.label}: {stageData.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </div>
                    );
                })}
            </div>

            {/* QR Action Buttons */}
            {action === 'exit' && !qrData && (
                <button
                    onClick={() => onExitQR(gp._id)}
                    disabled={qrLoading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'rgba(153,4,182,0.9)',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: qrLoading ? 'not-allowed' : 'pointer',
                        opacity: qrLoading ? 0.6 : 1,
                    }}
                >
                    {qrLoading ? 'Generating...' : 'Generate Exit QR'}
                </button>
            )}
            {action === 'entry' && !qrData && (
                <button
                    onClick={() => onEntryQR(gp._id)}
                    disabled={qrLoading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'rgba(22,163,74,0.9)',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: qrLoading ? 'not-allowed' : 'pointer',
                        opacity: qrLoading ? 0.6 : 1,
                    }}
                >
                    {qrLoading ? 'Generating...' : 'Generate Entry QR'}
                </button>
            )}
            {action === 'utilized' && (
                <div style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(100,100,100,0.8)',
                    color: '#fff',
                    fontWeight: 700,
                    textAlign: 'center',
                }}>
                    ✓ Gatepass Utilized
                </div>
            )}
            {action === 'expired' && (
                <div style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(220,38,38,0.2)',
                    color: '#dc2626',
                    fontWeight: 700,
                    textAlign: 'center',
                }}>
                    Gatepass Expired (In-time passed)
                </div>
            )}
        </div>
    );
};

// Progress Tracker Component (like delivery tracker ss-2)
const ProgressTracker = ({ stages, isRejected }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Background line */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '20px',
                right: '20px',
                height: '3px',
                background: '#e0e0e0',
                transform: 'translateY(-50%)',
                zIndex: 0,
            }} />

            {stages.map((stage, idx) => {
                let bgColor = '#e0e0e0';
                let iconColor = '#999';
                let icon = null;

                if (stage.status === 'completed' || stage.status === 'approved') {
                    bgColor = '#16a34a';
                    iconColor = '#fff';
                    icon = '✓';
                } else if (stage.status === 'rejected') {
                    bgColor = '#dc2626';
                    iconColor = '#fff';
                    icon = '✗';
                } else if (stage.status === 'current') {
                    bgColor = 'rgba(153, 4, 182, 1)';
                    iconColor = '#fff';
                    icon = '●';
                }

                return (
                    <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: bgColor,
                            color: iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '14px',
                            border: '3px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        }}>
                            {icon}
                        </div>
                        <div style={{
                            marginTop: '6px',
                            fontSize: '10px',
                            fontWeight: 600,
                            textAlign: 'center',
                            color: stage.status === 'current' ? 'rgba(153,4,182,1)' : stage.status === 'pending' ? '#999' : '#333',
                            maxWidth: '70px',
                        }}>
                            {stage.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TrackGatepass;
