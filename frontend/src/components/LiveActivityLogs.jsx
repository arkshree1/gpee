import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getAdminLiveLogs, getImageUrl } from '../api/api';

/**
 * LiveActivityLogs - Production-grade real-time activity logs panel
 * Features:
 * - Polling every 5 seconds (only this component updates, not the page)
 * - Smooth UI updates without flicker
 * - Internal scrolling
 * - Entry (green) / Exit (red) color coding
 * - Timestamp in blue
 * - Responsive design
 * - Clickable student name/avatar to view details
 */
const LiveActivityLogs = ({ onStudentClick }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);
    const pollIntervalRef = useRef(null);

    // Format timestamp to readable format
    const formatTime = useCallback((timestamp) => {
        if (!timestamp) return '--:--';
        const date = new Date(timestamp);
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    }, []);

    // Fetch logs function
    const fetchLogs = useCallback(async () => {
        try {
            const res = await getAdminLiveLogs();
            setLogs(res.data.logs || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch live logs:', err);
            setError('Failed to load logs');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch and polling setup
    useEffect(() => {
        fetchLogs();

        // Poll every 5 seconds
        pollIntervalRef.current = setInterval(fetchLogs, 5000);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [fetchLogs]);

    // Handle student click
    const handleStudentClick = (log) => {
        if (onStudentClick && log.studentId) {
            onStudentClick({
                _id: log.studentId,
                name: log.studentName,
                rollnumber: log.rollNumber,
                imageUrl: log.imageUrl
            });
        }
    };

    return (
        <div className="live-logs-panel">
            {/* Header */}
            <div className="live-logs-header">
                <span className="live-logs-title">LIVE ACTIVITY</span>
                <span className="live-logs-indicator" title="Auto-refreshing every 5s">
                    <span className="live-logs-dot"></span>
                </span>
            </div>

            {/* Logs Container */}
            <div className="live-logs-container" ref={scrollRef}>
                {loading && logs.length === 0 && (
                    <div className="live-logs-empty">Loading...</div>
                )}

                {error && (
                    <div className="live-logs-error">{error}</div>
                )}

                {!loading && !error && logs.length === 0 && (
                    <div className="live-logs-empty">No recent activity</div>
                )}

                {logs.map((log, index) => (
                    <div key={log.id || index} className="live-log-item">
                        <span className="live-log-time">{formatTime(log.timestamp)}</span>
                        <div className="live-log-timeline">
                            <span className={`live-log-dot ${log.actionType === 'ENTRY' ? 'entry' : 'exit'}`}></span>
                        </div>
                        <div className="live-log-content">
                            <span className={`live-log-action ${log.actionType === 'ENTRY' ? 'entry' : 'exit'}`}>
                                {log.actionType}
                            </span>
                            <div
                                className={`live-log-student ${onStudentClick ? 'clickable' : ''}`}
                                onClick={() => handleStudentClick(log)}
                                role={onStudentClick ? 'button' : undefined}
                                tabIndex={onStudentClick ? 0 : undefined}
                            >
                                <img
                                    src={getImageUrl(log.imageUrl) || '/default-avatar.png'}
                                    alt=""
                                    className="live-log-avatar"
                                />
                                <div className="live-log-info">
                                    <span className="live-log-name">{log.studentName}</span>
                                    <span className="live-log-roll">{log.rollNumber}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveActivityLogs;
