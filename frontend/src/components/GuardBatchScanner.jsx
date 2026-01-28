import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { scanQrToken, decideRequest } from '../api/api';

/**
 * GuardBatchScanner - Persistent camera mode for fast batch scanning
 * 
 * Features:
 * - Pre-warmed camera stream (passed from parent)
 * - Split-screen: Camera (left) + Details (right)
 * - Camera stays open between scans
 * - Close button appears after 5 successful scans
 */

const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const fallbackAvatar =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="#9aa5b1"><circle cx="60" cy="42" r="26" fill="#cbd5e1"/><path d="M16 114c0-24 18-42 44-42s44 18 44 42" fill="#cbd5e1"/></svg>'
    );

const GuardBatchScanner = ({ cameraStream, onClose, onScanComplete }) => {
    const videoRef = useRef(null);
    const readerRef = useRef(null);
    const scanningRef = useRef(false);

    const [scanCount, setScanCount] = useState(0);
    const [pending, setPending] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastAction, setLastAction] = useState(null); // 'approved' | 'rejected'

    // Create ZXing reader once
    const reader = useMemo(() => new BrowserMultiFormatReader(), []);

    // Attach stream to video and start scanning
    useEffect(() => {
        if (!cameraStream || !videoRef.current) return;

        const video = videoRef.current;
        video.srcObject = cameraStream;
        video.play().catch(() => { });

        readerRef.current = reader;
        scanningRef.current = true;

        // Start continuous scanning
        reader.decodeFromVideoElement(video, (result, err) => {
            if (!scanningRef.current) return;
            if (result && !pending && !verifying) {
                // Temporarily pause scanning while processing
                scanningRef.current = false;
                handleToken(result.getText());
            }
        });

        return () => {
            scanningRef.current = false;
            if (readerRef.current && typeof readerRef.current.reset === 'function') {
                try {
                    readerRef.current.reset();
                } catch { }
            }
        };
    }, [cameraStream, reader, pending, verifying]);

    const handleToken = async (token) => {
        setError('');
        setVerifying(true);
        setLastAction(null);

        try {
            const res = await scanQrToken({ token });
            setPending(res.data);
            setScanCount(prev => prev + 1);
        } catch (e) {
            setError(e?.response?.data?.message || 'Invalid/expired/used token');
            // Resume scanning after error
            setTimeout(() => {
                scanningRef.current = true;
            }, 1500);
        } finally {
            setVerifying(false);
        }
    };

    const doDecide = async (decision) => {
        if (!pending?.requestId) return;
        setDecisionLoading(true);

        try {
            await decideRequest({ requestId: pending.requestId, decision });
            setLastAction(decision === 'approve' ? 'approved' : 'rejected');
            setPending(null);
            onScanComplete?.();

            // Resume scanning after decision
            setTimeout(() => {
                setLastAction(null);
                scanningRef.current = true;
            }, 1000);
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to submit decision');
        } finally {
            setDecisionLoading(false);
        }
    };

    const prettyDirection = pending?.direction === 'exit' ? 'Exit' : 'Entry';

    const photoSrc = pending?.student?.imageUrl
        ? normalizeImageUrl(pending.student.imageUrl)
        : fallbackAvatar;

    const canClose = scanCount >= 5;

    return (
        <div className="guard-batch-overlay">
            <div className="guard-batch-container">
                {/* Left: Camera */}
                <div className="guard-batch-left">
                    <div className="guard-batch-camera-header">
                        <span className="guard-batch-title">Batch Scan Mode</span>
                        <span className="guard-batch-counter">Scans: {scanCount}</span>
                    </div>

                    <video
                        ref={videoRef}
                        className="guard-batch-video"
                        muted
                        playsInline
                        autoPlay
                    />

                    <div className="guard-batch-camera-footer">
                        {verifying && (
                            <div className="guard-batch-status verifying">
                                <div className="guard-batch-spinner"></div>
                                Verifying...
                            </div>
                        )}
                        {error && (
                            <div className="guard-batch-status error">
                                {error}
                            </div>
                        )}
                        {!verifying && !error && !pending && (
                            <div className="guard-batch-status ready">
                                Ready to scan next QR...
                            </div>
                        )}

                        {canClose && (
                            <button
                                className="guard-batch-close-btn"
                                onClick={onClose}
                                type="button"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Close Scanner
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Student Details */}
                <div className="guard-batch-right">
                    {lastAction && !pending && (
                        <div className={`guard-batch-action-result ${lastAction}`}>
                            {lastAction === 'approved' ? (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Approved!
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    Rejected
                                </>
                            )}
                        </div>
                    )}

                    {!pending && !lastAction && (
                        <div className="guard-batch-empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                            <span>Scan a QR code to see student details</span>
                        </div>
                    )}

                    {pending && (
                        <div className="guard-batch-details">
                            <div className="guard-batch-photo-section">
                                <img
                                    className="guard-batch-photo"
                                    src={photoSrc}
                                    alt="Student"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = fallbackAvatar;
                                    }}
                                />
                                <div className={`guard-batch-direction ${pending.direction}`}>
                                    {prettyDirection}
                                </div>
                            </div>

                            <div className="guard-batch-info">
                                <div className="guard-batch-name">{pending.student?.name}</div>
                                <div className="guard-batch-roll">{pending.student?.rollnumber}</div>

                                {pending.gatePassNo && (
                                    <div className="guard-batch-gatepass">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                                        </svg>
                                        {pending.gatePassNo}
                                    </div>
                                )}

                                <div className="guard-batch-info-grid">
                                    <div className="guard-batch-info-item">
                                        <label>Purpose</label>
                                        <div>{pending.purpose || pending.student?.outPurpose || '-'}</div>
                                    </div>
                                    <div className="guard-batch-info-item">
                                        <label>Place</label>
                                        <div>{pending.place || pending.student?.outPlace || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="guard-batch-actions">
                                <button
                                    className="guard-batch-btn reject"
                                    type="button"
                                    disabled={decisionLoading}
                                    onClick={() => doDecide('reject')}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    Reject
                                </button>
                                <button
                                    className="guard-batch-btn approve"
                                    type="button"
                                    disabled={decisionLoading}
                                    onClick={() => doDecide('approve')}
                                >
                                    {decisionLoading ? (
                                        <span>Processing...</span>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Approve
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuardBatchScanner;
