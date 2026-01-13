import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getAdminLiveLogs } from '../api/api';

/**
 * LiveActivityLogs - Production-grade real-time activity logs panel
 * Features:
 * - Polling every 5 seconds (only this component updates, not the page)
 * - Smooth UI updates without flicker
 * - Internal scrolling
 * - Entry (green) / Exit (red) color coding
 * - Timestamp in blue
 * - Responsive design
 */
const LiveActivityLogs = () => {
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

    return (
        <div className="live-logs-panel">
            {/* Header */}
            <div className="live-logs-header">
                <span className="live-logs-title">Live Activity</span>
                <span className="live-logs-indicator" title="Auto-refreshing every 5s">
                    <span className="live-logs-dot"></span>
                    LIVE
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
                        <div className="live-log-header">
                            <span className={`live-log-action ${log.actionType === 'ENTRY' ? 'entry' : 'exit'}`}>
                                {log.actionType}
                            </span>
                            <span className="live-log-time">{formatTime(log.timestamp)}</span>
                        </div>
                        <div className="live-log-student">
                            <span className="live-log-name">{log.studentName}</span>
                            <span className="live-log-roll">{log.rollNumber}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveActivityLogs;
