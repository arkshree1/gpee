/**
 * Socket.IO Client Utility
 * Manages WebSocket connection for real-time updates
 */
import { io } from 'socket.io-client';

// Socket instance (singleton)
let socket = null;

// Get backend URL from environment
const getSocketUrl = () => {
    return process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
};

/**
 * Initialize socket connection with authentication
 * @param {string} token - JWT auth token
 * @returns {object} Socket instance
 */
export const initSocket = (token) => {
    if (socket?.connected) {
        return socket;
    }

    const socketUrl = getSocketUrl();

    socket = io(socketUrl, {
        path: '/socket.io',
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.warn('⚠️ Socket connection error:', error.message);
    });

    return socket;
};

/**
 * Get the current socket instance
 * @returns {object|null} Socket instance or null
 */
export const getSocket = () => socket;

/**
 * Disconnect and cleanup socket
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket disconnected and cleaned up');
    }
};

/**
 * Subscribe to gate decision events
 * @param {function} callback - Handler function for gate-decision events
 * @returns {function} Unsubscribe function
 */
export const onGateDecision = (callback) => {
    if (!socket) {
        console.warn('⚠️ Socket not initialized. Call initSocket() first.');
        return () => { };
    }

    socket.on('gate-decision', callback);

    // Return unsubscribe function
    return () => {
        socket?.off('gate-decision', callback);
    };
};

/**
 * Subscribe to activity update events
 * @param {function} callback - Handler function for activity-update events
 * @returns {function} Unsubscribe function
 */
export const onActivityUpdate = (callback) => {
    if (!socket) {
        console.warn('⚠️ Socket not initialized. Call initSocket() first.');
        return () => { };
    }

    socket.on('activity-update', callback);

    // Return unsubscribe function
    return () => {
        socket?.off('activity-update', callback);
    };
};

export default {
    initSocket,
    getSocket,
    disconnectSocket,
    onGateDecision,
    onActivityUpdate,
};
