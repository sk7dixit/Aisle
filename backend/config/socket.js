const { createAdapter } = require("@socket.io/redis-adapter");
const { getPubClient, getSubClient, isRedisActive } = require("./redis");
const crypto = require("crypto");

let io;

const initSocket = (server) => {
    const { Server } = require("socket.io");
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['https://aisle.in', 'https://app.aisle.in', 'https://admin.aisle.in', 'http://localhost:5173'];

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        },
        connectionStateRecovery: {
            // max duration for state recovery (default: 2 minutes)
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true
        }
    });

    if (isRedisActive()) {
        const pubClient = getPubClient();
        const subClient = getSubClient();
        if (pubClient && subClient) {
            io.adapter(createAdapter(pubClient, subClient));
            console.log("📶 Socket.io Redis adapter integrated successfully");
        } else {
            console.warn("⚠️ Redis clients unavailable for Socket.io adapter");
        }
    } else {
        console.log("ℹ️ Socket.io using default in-memory adapter");
    }

    io.on("connection", (socket) => {
        console.log(`🔌 New Client Connected: ${socket.id}`);

        // Join Seller Room (Seller Dashboard specific events)
        socket.on("seller:join", (sellerId) => {
            try {
                if (!sellerId) return;
                socket.join(`seller:${sellerId}`);
                console.log(`🛒 Seller Joined Room: seller:${sellerId}`);
            } catch (err) {
                console.error("[Socket-seller:join] Error:", err.message);
            }
        });

        // Join User Room (Real-time messaging & notifications)
        socket.on("user:join", (userId) => {
            try {
                if (!userId) return;
                socket.join(`user:${userId}`);
                console.log(`👤 User Joined Room: user:${userId}`);
            } catch (err) {
                console.error("[Socket-user:join] Error:", err.message);
            }
        });

        // Join Conversation Room
        socket.on("conversation:join", (conversationId) => {
            try {
                if (!conversationId) return;
                socket.join(`conversation:${conversationId}`);
                console.log(`💬 Joined Conversation Room: conversation:${conversationId}`);
            } catch (err) {
                console.error("[Socket-conversation:join] Error:", err.message);
            }
        });

        // Customer Join Shop Room (Real-time Status)
        socket.on("customer:join_shop", (shopId) => {
            try {
                if (!shopId) return;
                const room = `shop:${shopId}`;
                socket.join(room);
                console.log(`👀 Customer Joined Shop Room: ${room}`);
            } catch (err) {
                console.error("[Socket-customer:join_shop] Error:", err.message);
            }
        });

        // Client Event Sync Request (recovers offline/missed queued events)
        socket.on("user:sync", async (userId) => {
            try {
                if (!userId) return;
                console.log(`🔄 Syncing missed events for user: ${userId}`);
                const { getRedisClient, isRedisActive } = require("./redis");
                if (isRedisActive()) {
                    try {
                        const redis = getRedisClient();
                        const queueKey = `socket:queue:${userId}`;
                        const items = await redis.lrange(queueKey, 0, -1);
                        if (items && items.length > 0) {
                            const parsed = items.map(item => JSON.parse(item));
                            socket.emit("sync:events", parsed);
                        }
                    } catch (err) {
                        console.error("[Socket-Sync] Failed to fetch sync events:", err.message);
                    }
                }
            } catch (err) {
                console.error("[Socket-user:sync] General error:", err.message);
            }
        });

        // Client Event Acknowledgement (clears event from Redis queue)
        socket.on("event:ack", async ({ eventId, userId }) => {
            try {
                if (!userId || !eventId) return;
                const { getRedisClient, isRedisActive } = require("./redis");
                if (isRedisActive()) {
                    try {
                        const redis = getRedisClient();
                        const queueKey = `socket:queue:${userId}`;
                        const items = await redis.lrange(queueKey, 0, -1);
                        for (let item of items) {
                            const parsed = JSON.parse(item);
                            if (parsed.id === eventId) {
                                await redis.lrem(queueKey, 0, item);
                                console.log(`✅ Event acknowledged and cleared from queue: ${eventId} for user ${userId}`);
                                break;
                            }
                        }
                    } catch (err) {
                        console.error("[Socket-Ack] Failed to process event ack:", err.message);
                    }
                }
            } catch (err) {
                console.error("[Socket-event:ack] General error:", err.message);
            }
        });

        socket.on("disconnect", (reason) => {
            try {
                console.log(`❌ Client Disconnected: ${socket.id}. Reason: ${reason}`);
                
                // Clean up custom listeners on this socket to prevent memory leak retention
                const events = ["seller:join", "user:join", "conversation:join", "customer:join_shop", "user:sync", "event:ack", "disconnect"];
                events.forEach(event => {
                    socket.removeAllListeners(event);
                });
                
                // Clear socket room references explicitly by converting Set to Array
                const rooms = Array.from(socket.rooms);
                rooms.forEach(room => {
                    socket.leave(room);
                });
            } catch (err) {
                console.error("[Socket-disconnect] Error during cleanup:", err.message);
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const disconnectUserSockets = (userId) => {
    try {
        const ioInstance = getIO();
        if (userId === 'all') {
            ioInstance.disconnectSockets(true);
            console.log("🔌 Disconnected all active socket connections globally");
        } else {
            ioInstance.in(`user:${userId}`).disconnectSockets(true);
            console.log(`🔌 Disconnected all socket connections for user room: user:${userId}`);
        }
    } catch (err) {
        console.error(`[Socket] Failed to disconnect sockets for user ${userId}:`, err.message);
    }
};

/**
 * Queues a critical event in Redis and broadcasts it over Socket.io
 * @param {string} userId - Target user identifier
 * @param {string} eventName - Name of socket event
 * @param {Object} payload - Event data payload
 */
const queueAndEmit = async (userId, eventName, payload) => {
    const eventId = crypto.randomUUID();
    const eventData = {
        id: eventId,
        name: eventName,
        payload,
        timestamp: Date.now()
    };

    const { getRedisClient, isRedisActive } = require("./redis");
    if (isRedisActive()) {
        try {
            const redis = getRedisClient();
            const queueKey = `socket:queue:${userId}`;
            await redis.rpush(queueKey, JSON.stringify(eventData));
            await redis.ltrim(queueKey, -100, -1); // Keep last 100 events
            await redis.expire(queueKey, 7200); // 2-hour queue expiration
            console.log(`📦 Queued critical event: ${eventName} (${eventId}) for user ${userId}`);
        } catch (err) {
            console.error("[Socket-Queue] Redis queue push failed:", err.message);
        }
    }

    try {
        const ioInstance = getIO();
        ioInstance.to(`user:${userId}`).emit(eventName, eventData);
    } catch (socketError) {
        console.warn("[Socket-Queue] Real-time emit failed:", socketError.message);
    }
};

module.exports = { initSocket, getIO, queueAndEmit, disconnectUserSockets };

