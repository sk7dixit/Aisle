const { getPubClient, getSubClient, isRedisActive } = require('../config/redis');
const CentralEvent = require('../models/CentralEvent');

let isSubscribed = false;

const initEventBus = async () => {
    if (!isRedisActive()) {
        console.log('[EventBus] Redis inactive. Direct memory event bus emulation in use.');
        return;
    }

    if (isSubscribed) return;

    try {
        const subClient = getSubClient();
        if (subClient) {
            await subClient.subscribe('aisle:events');
            subClient.on('message', async (channel, message) => {
                if (channel === 'aisle:events') {
                    try {
                        const event = JSON.parse(message);
                        console.log(`[EventBus] Received cross-node event: ${event.type}`, event.payload);
                        await handleCrossNodeEvent(event);
                    } catch (parseErr) {
                        console.error('[EventBus] Message parse error:', parseErr.message);
                    }
                }
            });
            isSubscribed = true;
            console.log('[EventBus] Successfully subscribed to cross-node event bus channel "aisle:events"');
        }
    } catch (err) {
        console.error('[EventBus] Failed to initialize cross-node subscription:', err.message);
    }
};

const publishEvent = async (type, payload) => {
    const timestamp = Date.now();
    const version = payload.version || payload.doc?.version || 1;
    const event = { type, payload, senderNode: process.pid.toString(), timestamp, version };

    // 1. Centralized Audit Log: Persist critical event in MongoDB for replay and tracking
    try {
        await CentralEvent.create({
            type,
            payload,
            senderNode: process.pid.toString(),
            timestamp,
            version
        });
    } catch (dbErr) {
        console.error('[EventBus] Failed to persist event in MongoDB:', dbErr.message);
    }

    // 2. Publish to Redis Stream for Distributed Audit Trail
    if (isRedisActive()) {
        try {
            const redis = require('../config/redis').getRedisClient();
            await redis.xadd('aisle:audit:stream', '*', 
                'type', type, 
                'senderNode', process.pid.toString(), 
                'timestamp', timestamp.toString(), 
                'version', version.toString()
            );
        } catch (streamErr) {
            console.error('[EventBus] Redis Stream logging failed:', streamErr.message);
        }
    }

    if (!isRedisActive()) {
        console.log(`[EventBus-Local] Emulating local publish: ${type}`);
        await handleCrossNodeEvent(event);
        return;
    }

    try {
        const pubClient = getPubClient();
        if (pubClient) {
            await pubClient.publish('aisle:events', JSON.stringify(event));
            console.log(`[EventBus] Published cross-node event: ${type}`);
        }
    } catch (err) {
        console.error(`[EventBus] Failed to publish event ${type}:`, err.message);
        await handleCrossNodeEvent(event);
    }
};

const handleCrossNodeEvent = async (event, isReplay = false) => {
    const searchCache = require('./searchCache');
    const { getRedisClient, isRedisActive } = require('../config/redis');
    const redis = getRedisClient();

    // 1. Extract Partition Key from payload
    const payload = event.payload || {};
    const productId = payload.productId || payload.product?._id || payload.id;
    const userId = payload.userId || payload.user?._id;
    const requestId = payload.requestId || payload.request?._id;
    
    let partitionKey = null;
    if (productId) partitionKey = `product:${productId}`;
    else if (userId) partitionKey = `user:${userId}`;
    else if (requestId) partitionKey = `request:${requestId}`;

    if (isRedisActive() && partitionKey) {
        // A. Event Ordering Guarantees: Drop out-of-order events
        const lastTimestamp = await redis.get(`event:last_timestamp:${partitionKey}`);
        if (lastTimestamp && event.timestamp < parseInt(lastTimestamp, 10)) {
            console.log(`[EventBus] Rejecting out-of-order event ${event.type} for partition ${partitionKey} (Event ts: ${event.timestamp}, Last processed: ${lastTimestamp})`);
            return;
        }
        await redis.set(`event:last_timestamp:${partitionKey}`, event.timestamp);

        // B. Versioned State Updates: Reject stale state writes
        const version = event.version || 1;
        const lastVersion = await redis.get(`event:last_version:${partitionKey}`);
        if (lastVersion && version < parseInt(lastVersion, 10)) {
            console.log(`[EventBus] Rejecting stale version event ${event.type} for partition ${partitionKey} (Event version: ${version}, Last version: ${lastVersion})`);
            return;
        }
        await redis.set(`event:last_version:${partitionKey}`, version);
    }

    switch (event.type) {
        case 'CACHE_INVALIDATE':
        case 'PRODUCT_CREATED':
        case 'PRODUCT_UPDATED':
        case 'PRODUCT_DELETED': {
            console.log(`[EventBus] Invalidating search cache for event: ${event.type}`);
            await searchCache.clear();

            // Step 8: Search Index Sync Queueing
            if (productId) {
                try {
                    const { searchQueue } = require('../config/queue');
                    await searchQueue.add('syncProductIndex', { productId, action: event.type });
                    console.log(`[EventBus] Queued syncProductIndex in searchQueue for product: ${productId}`);
                } catch (qErr) {
                    console.error('[EventBus] Failed to queue search index sync:', qErr.message);
                }
            }
            break;
        }
            
        case 'SELLER_STATUS_CHANGED':
        case 'SELLER_SUSPENDED':
        case 'USER_SUSPENDED':
        case 'USER_REVOKED':
        case 'SECURITY_ALERT': {
            const targetId = payload.userId || payload.sellerId || payload.id || event.payload;
            const reason = payload.reason || 'Security revocation/suspension';
            
            console.log(`[EventBus] Evicting sessions and closing sockets for target: ${targetId} (Event: ${event.type})`);
            try {
                if (targetId === 'all') {
                    // Evict all sessions
                    if (isRedisActive()) {
                        const sessionKeys = await redis.keys('session:*');
                        for (const key of sessionKeys) {
                            await redis.del(key);
                        }
                        const refreshKeys = await redis.keys('refresh:*');
                        for (const rk of refreshKeys) {
                            await redis.del(rk);
                        }
                        const roles = ['customer', 'seller', 'admin', 'super_admin', 'moderator'];
                        for (const r of roles) {
                            await redis.del(`online:${r}`);
                        }
                    }
                } else if (targetId) {
                    if (isRedisActive()) {
                        const keys = await redis.keys(`session:${targetId}:*`);
                        for (const key of keys) {
                            const sessionData = await redis.get(key);
                            if (sessionData) {
                                try {
                                    const s = JSON.parse(sessionData);
                                    if (s.tokenHash) await redis.del(`session:${s.tokenHash}`);
                                } catch (e) {}
                            }
                            await redis.del(key);
                        }
                        const refreshKeys = await redis.keys(`refresh:${targetId}:*`);
                        for (const rk of refreshKeys) {
                            await redis.del(rk);
                        }
                        const roles = ['customer', 'seller', 'admin', 'super_admin', 'moderator'];
                        for (const r of roles) {
                            const refreshKeysUser = await redis.keys(`refresh:${targetId}:*`);
                            for (const rku of refreshKeysUser) {
                                const devId = rku.split(':').pop();
                                await redis.zrem(`online:${r}`, `${targetId}:${devId}`);
                            }
                        }
                    }
                }

                // Disconnect active socket connections globally across nodes
                if (targetId) {
                    const { disconnectUserSockets } = require('../config/socket');
                    disconnectUserSockets(targetId);
                }
                
                console.log(`[EventBus] Terminated active sessions and sockets for target: ${targetId}`);
            } catch (err) {
                console.error('[EventBus] Eviction handling failed:', err.message);
            }
            break;
        }

        case 'USER_UPDATED':
            console.log(`[EventBus] User updated: ${userId}. Invalidating user related caches.`);
            break;

        case 'SUBSCRIPTION_UPDATED':
            console.log(`[EventBus] Subscription updated: ${userId}. Invalidating caches.`);
            await searchCache.clear();
            break;

        case 'REQUEST_CREATED':
        case 'REQUEST_ACCEPTED':
        case 'REQUEST_COMPLETED': {
            console.log(`[EventBus] Broadcasting socket event cluster-wide for: ${event.type}`);
            try {
                const { getIO } = require('../config/socket');
                const io = getIO();
                const customerRoom = `user:${payload.customerId}`;
                const sellerRoom = `user:${payload.sellerId}`;
                
                const socketEventPayload = {
                    type: event.type,
                    payload
                };
                
                io.to(customerRoom).emit('request:status_changed', socketEventPayload);
                io.to(sellerRoom).emit('request:status_changed', socketEventPayload);
            } catch (ioErr) {
                console.warn('[EventBus] Sockets broadcast warning:', ioErr.message);
            }
            break;
        }

        default:
            console.warn(`[EventBus] Unhandled cross-node event type: ${event.type}`);
    }
};

const catchUpEvents = async () => {
    try {
        // Catch up on events from the last 5 minutes to cover offline duration
        const cutoff = Date.now() - 5 * 60 * 1000;
        const events = await CentralEvent.find({ timestamp: { $gt: cutoff } }).sort({ timestamp: 1 });
        console.log(`[EventBus] Catch-up: Replaying ${events.length} events from past 5 minutes...`);
        for (const event of events) {
            await handleCrossNodeEvent(event, true);
        }
        console.log('[EventBus] Catch-up complete.');
    } catch (err) {
        console.error('[EventBus] Event catch-up failed:', err.message);
    }
};

module.exports = { initEventBus, publishEvent, handleCrossNodeEvent, catchUpEvents };
