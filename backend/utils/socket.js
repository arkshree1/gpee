/**
 * Socket.IO Server Utility
 * Manages WebSocket connections for real-time updates
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - The HTTP server instance
 * @param {string[]} allowedOrigins - Array of allowed CORS origins
 */
const initSocket = (httpServer, allowedOrigins) => {
    io = new Server(httpServer, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
        // Path for socket connections
        path: '/socket.io',
    });

    // JWT Authentication middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            // Allow unauthenticated connections but don't join any rooms
            socket.userId = null;
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // IMPORTANT: JWT payload uses 'userId' not 'id'
            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            // Invalid token - allow connection but don't authenticate
            console.warn('⚠️ Socket auth failed:', err.message);
            socket.userId = null;
            next();
        }
    });

    // Handle new connections
    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id} (userId: ${socket.userId || 'anonymous'})`);

        // Join user-specific room if authenticated
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
            console.log(`   → Joined room: user:${socket.userId}`);
        }

        // Handle manual room joining (for authenticated users changing context)
        socket.on('join-room', (roomId) => {
            if (socket.userId && roomId === socket.userId) {
                socket.join(`user:${roomId}`);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 Socket disconnected: ${socket.id} (reason: ${reason})`);
        });
    });

    console.log('🔌 Socket.IO server initialized');
    return io;
};

/**
 * Get the Socket.IO server instance
 * @returns {Server|null} The Socket.IO server instance
 */
const getIO = () => {
    if (!io) {
        console.warn('⚠️ Socket.IO not initialized. Call initSocket() first.');
    }
    return io;
};

/**
 * Emit a gate decision event to a specific student
 * @param {string} studentId - The student's user ID
 * @param {object} data - The event data
 */
const emitGateDecision = (studentId, data) => {
    if (!io) {
        console.warn('⚠️ Cannot emit: Socket.IO not initialized');
        return;
    }

    io.to(`user:${studentId}`).emit('gate-decision', {
        ...data,
        timestamp: new Date().toISOString(),
    });

    console.log(`📤 Emitted gate-decision to user:${studentId}`, data.outcome);
};

/**
 * Emit an activity update event (for live activity logs)
 * @param {string} studentId - The student's user ID
 * @param {object} logData - The new log entry data
 */
const emitActivityUpdate = (studentId, logData) => {
    if (!io) return;

    io.to(`user:${studentId}`).emit('activity-update', {
        ...logData,
        timestamp: new Date().toISOString(),
    });
};

module.exports = {
    initSocket,
    getIO,
    emitGateDecision,
    emitActivityUpdate,
};
