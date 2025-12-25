import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyGatepasses, applyGatepassExit, applyGatepassEntry, cancelGate } from '../api/api';
import PopupBox from './PopupBox';
import '../styles/student.css';

const TrackGatepass = () => {
    const navigate = useNavigate();
    const [gatepasses, setGatepasses] = useState([]);
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
            const res = await getMyGatepasses();
            setGatepasses(res.data.gatepasses || []);
            setPresence(res.data.presence || 'inside');
            setActiveGatePassNo(res.data.activeGatePassNo || null);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to fetch gatepasses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGatepasses();
        // Poll very fast when QR is displayed to detect approval quicker
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
            if (remaining <= 0) {
                setQrData(null);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [qrData]);

    // Auto-dismiss QR when guard approves (detected via presence change)
    useEffect(() => {
        if (!qrData) return;

        // If showing exit QR and presence changed to 'outside' -> guard approved
        if (qrData.direction === 'exit' && presence === 'outside') {
            setQrData(null);
            setPopupMessage('Exit approved! You are now outside campus.');
            // Immediately refresh gatepasses to show updated state
            fetchGatepasses();
        }
        // If showing entry QR and presence changed to 'inside' -> guard approved
        if (qrData.direction === 'entry' && presence === 'inside') {
            setQrData(null);
            setPopupMessage('Entry approved! You are now inside campus.');
            // Immediately refresh gatepasses to show updated state
            fetchGatepasses();
        }
    }, [presence, qrData]);

    const handleGenerateExitQR = async (gatepassId) => {
        setQrLoading(true);
        try {
            const res = await applyGatepassExit({ gatepassId });
            setQrData({
                qrDataUrl: res.data.qrDataUrl,
                expiresAt: res.data.expiresAt,
                gatePassNo: res.data.gatePassNo,
                direction: 'exit',
            });
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
            setQrData({
                qrDataUrl: res.data.qrDataUrl,
                expiresAt: res.data.expiresAt,
                gatePassNo: res.data.gatePassNo,
                direction: 'entry',
            });
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
            setPopupMessage('QR dismissed');
        } catch (err) {
            setPopupMessage(err?.response?.data?.message || 'Failed to dismiss QR');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    // Format date as dd/mm/yy
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };

    // Format time as 12hr with AM/PM
    const formatTime12hr = (timeStr) => {
        if (!timeStr) return '';
        // Handle HH:MM format
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        return `${hours}:${minutes} ${ampm}`;
    };

    // Check if gatepass in time has passed (current time > dateIn + timeIn)
    const hasGatepassExpired = (gp) => {
        if (!gp.dateIn || !gp.timeIn) return false;
        try {
            // Parse dateIn (assuming ISO format like 2025-12-25 or similar)
            const inDate = new Date(gp.dateIn);
            if (isNaN(inDate.getTime())) return false;

            // Parse timeIn (assuming HH:MM format)
            const timeParts = gp.timeIn.split(':');
            if (timeParts.length < 2) return false;

            inDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);

            return Date.now() > inDate.getTime();
        } catch {
            return false;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#16a34a';
            case 'denied': return '#dc2626';
            default: return '#f59e0b';
        }
    };

    // Determine what action to show for a gatepass
    const getGatepassAction = (gp) => {
        if (gp.status !== 'approved') return null;

        // If student is outside with THIS gatepass -> show Entry button (highest priority)
        // This takes precedence over everything else - even if time expired, student needs to enter
        if (presence === 'outside' && activeGatePassNo === gp.gatePassNo) {
            return 'entry';
        }

        // If gatepass is marked as utilized (exit + entry completed) -> show utilized
        if (gp.utilized) {
            return 'expired';
        }

        // If student is inside and gatepass time has expired -> show utilized
        if (presence === 'inside' && hasGatepassExpired(gp)) {
            return 'expired';
        }

        // If student is inside and gatepass is still valid -> show Exit button
        if (presence === 'inside') {
            return 'exit';
        }

        // Student is outside with a different gatepass
        return null;
    };

    return (
        <div className="student-shell">
            <header className="student-header">
                <button className="student-back" onClick={() => navigate('/student')}>
                    ← Back
                </button>
                <div>
                    <div className="brand">Passly</div>
                    <div className="sub">by Watchr</div>
                </div>
            </header>

            <main className="student-main">
                <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Track Gatepass</h2>

                {loading && <p>Loading gatepasses...</p>}
                {error && <p style={{ color: '#b00020', fontWeight: 600 }}>{error}</p>}

                {/* QR Code Display */}
                {qrData && (
                    <div className="student-qr-card" style={{ marginBottom: '20px' }}>
                        <div className="student-qr-top">
                            GATEPASS {qrData.direction?.toUpperCase()} QR - {qrData.gatePassNo}
                        </div>
                        <img src={qrData.qrDataUrl} alt={`${qrData.direction} QR`} className="student-qr" />
                        <div className="student-timer">
                            Expires in: {formatTime(countdown)}
                        </div>
                        <button className="student-dismiss-btn" onClick={handleDismissQR}>
                            Dismiss
                        </button>
                    </div>
                )}

                {!loading && gatepasses.length === 0 && (
                    <p style={{ opacity: 0.7, textAlign: 'center' }}>No gatepasses found</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {gatepasses.map((gp) => {
                        const action = getGatepassAction(gp);

                        return (
                            <div
                                key={gp._id}
                                style={{
                                    background: gp.status === 'approved'
                                        ? 'rgba(200, 240, 200, 0.9)'
                                        : gp.status === 'denied'
                                            ? 'rgba(255, 200, 200, 0.9)'
                                            : 'rgba(255, 240, 200, 0.9)',
                                    borderRadius: '14px',
                                    padding: '16px',
                                    border: '1px solid rgba(0,0,0,0.12)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '16px' }}>{gp.gatePassNo}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                            {gp.place} | Sem: {gp.semester}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: '#fff',
                                        background: getStatusColor(gp.status),
                                    }}>
                                        {gp.status.toUpperCase()}
                                    </span>
                                </div>

                                <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                                    <div><b>Out:</b> {formatDate(gp.dateOut)} {formatTime12hr(gp.timeOut)}</div>
                                    <div><b>In:</b> {formatDate(gp.dateIn)} {formatTime12hr(gp.timeIn)}</div>
                                </div>

                                {/* Exit Button */}
                                {action === 'exit' && !qrData && (
                                    <button
                                        onClick={() => handleGenerateExitQR(gp._id)}
                                        disabled={qrLoading}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'rgba(153, 4, 182, 0.9)',
                                            color: '#fff',
                                            fontWeight: 700,
                                            cursor: qrLoading ? 'not-allowed' : 'pointer',
                                            opacity: qrLoading ? 0.6 : 1,
                                        }}
                                    >
                                        {qrLoading ? 'Generating...' : 'Generate QR for Exit'}
                                    </button>
                                )}

                                {/* Entry Button */}
                                {action === 'entry' && !qrData && (
                                    <button
                                        onClick={() => handleGenerateEntryQR(gp._id)}
                                        disabled={qrLoading}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'rgba(22, 163, 74, 0.9)',
                                            color: '#fff',
                                            fontWeight: 700,
                                            cursor: qrLoading ? 'not-allowed' : 'pointer',
                                            opacity: qrLoading ? 0.6 : 1,
                                        }}
                                    >
                                        {qrLoading ? 'Generating...' : 'Generate QR for Entry'}
                                    </button>
                                )}

                                {/* Gatepass Utilized message */}
                                {action === 'expired' && (
                                    <div style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: 'rgba(100, 100, 100, 0.8)',
                                        color: '#fff',
                                        fontWeight: 700,
                                        textAlign: 'center',
                                    }}>
                                        ✓ Gatepass Utilized
                                    </div>
                                )}

                                {/* Rejected/Pending - no button, just the card info */}
                            </div>
                        );
                    })}
                </div>

                <PopupBox message={popupMessage} onClose={() => setPopupMessage('')} />
            </main>
        </div>
    );
};

export default TrackGatepass;

