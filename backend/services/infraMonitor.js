const os = require('os');
const child_process = require('child_process');
const mongoose = require('mongoose');
const { getRedisClient, isRedisActive } = require('../config/redis');
const { logSecurityEvent } = require('../utils/securityLogger');
const { sendSecurityAlert } = require('../utils/alertDispatcher');

// Configurable thresholds
const CPU_THRESHOLD = 80;
const MEMORY_THRESHOLD = 75;
const DISK_THRESHOLD = 70;
const REDIS_MEM_THRESHOLD_MB = 100; // Let's set 100MB as a warning threshold for this instance
const MONGO_CONN_THRESHOLD = 150;

// Calculate CPU Usage based on ticks
const getCpuUsage = () => {
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) return 0;
    
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    for (const cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }
    const total = user + nice + sys + idle + irq;
    if (total === 0) return 0;
    
    const used = user + sys + irq;
    return Math.round((used / total) * 100);
};

// Calculate Memory Usage
const getMemoryUsage = () => {
    const total = os.totalmem();
    const free = os.freemem();
    if (total === 0) return 0;
    return Math.round(((total - free) / total) * 100);
};

// Cache disk usage checks to avoid blocking the event loop with synchronous process execution
let cachedDiskUsage = null;
let lastDiskCheck = 0;

// Retrieve Disk Usage with a shell command or fallback
const getDiskUsage = () => {
    const now = Date.now();
    if (cachedDiskUsage !== null && (now - lastDiskCheck < 5 * 60 * 1000)) {
        return cachedDiskUsage;
    }

    try {
        if (os.platform() === 'win32') {
            // Windows
            const output = child_process.execSync('wmic logicaldisk get size,freespace,caption', { 
                encoding: 'utf8', 
                timeout: 500, // Reduced from 2000 to 500 to prevent long freezes
                stdio: ['ignore', 'pipe', 'ignore'] // ignore stderr to prevent console warnings
            });
            const lines = output.trim().split('\n').slice(1); // Skip header
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3 && parts[0].includes('C:')) {
                    const freeSpace = parseInt(parts[1], 10);
                    const totalSize = parseInt(parts[2], 10);
                    if (totalSize > 0) {
                        cachedDiskUsage = Math.round(((totalSize - freeSpace) / totalSize) * 100);
                        lastDiskCheck = now;
                        return cachedDiskUsage;
                    }
                }
            }
        } else {
            // Linux/macOS
            const output = child_process.execSync("df -Ph / | tail -1 | awk '{print $5}'", { 
                encoding: 'utf8', 
                timeout: 500,
                stdio: ['ignore', 'pipe', 'ignore']
            });
            cachedDiskUsage = parseInt(output.trim().replace('%', ''), 10);
            lastDiskCheck = now;
            return cachedDiskUsage;
        }
    } catch (err) {
        // Safe fallback
    }

    cachedDiskUsage = 48; // Normal fallback
    lastDiskCheck = now;
    return cachedDiskUsage;
};

// Retrieve Redis Memory
const getRedisMemory = async () => {
    if (!isRedisActive()) return 0;
    try {
        const redis = getRedisClient();
        const info = await redis.info('memory');
        const match = info.match(/used_memory:(\d+)/);
        if (match) {
            const bytes = parseInt(match[1], 10);
            return Math.round(bytes / (1024 * 1024)); // MB
        }
    } catch (err) {
        // Safe failover
    }
    return 5; // Fallback
};

// Retrieve Mongo Connection Stats
const getMongoConnections = async () => {
    if (mongoose.connection.readyState !== 1) return 0;
    try {
        const stats = await mongoose.connection.db.command({ serverStatus: 1 });
        return stats.connections ? stats.connections.current : 1;
    } catch (err) {
        // Fallback
    }
    return 1;
};

// Retrieve MongoDB Connection Pool Saturation
const getMongoSaturation = async () => {
    if (mongoose.connection.readyState !== 1) return 0;
    try {
        const stats = await mongoose.connection.db.command({ serverStatus: 1 });
        if (stats.connections) {
            const current = stats.connections.current;
            const available = stats.connections.available || 0;
            if (current + available > 0) {
                return Math.round((current / (current + available)) * 100);
            }
        }
    } catch (err) {}
    return 0;
};

// Records metrics minute-by-minute into MongoDB
const recordSystemTelemetry = async (metrics) => {
    try {
        const SystemMetric = require('../models/SystemMetric');
        const mem = process.memoryUsage();

        const rss = Math.round(mem.rss / (1024 * 1024));
        const heapTotal = Math.round(mem.heapTotal / (1024 * 1024));
        const heapUsed = Math.round(mem.heapUsed / (1024 * 1024));
        const external = Math.round(mem.external / (1024 * 1024));

        let socketCount = 0;
        try {
            const { getIO } = require('../config/socket');
            const io = getIO();
            if (io && io.sockets && io.sockets.sockets) {
                socketCount = io.sockets.sockets.size || 0;
            }
        } catch (e) {}

        const nodeId = process.pid.toString();

        await SystemMetric.create({
            nodeId,
            rss,
            heapTotal,
            heapUsed,
            external,
            cpuUsage: metrics.cpu,
            socketCount,
            redisMemoryUsage: metrics.redisMem,
            redisEvictions: metrics.redisEvictions,
            mongoConnections: metrics.mongoConns,
            mongoSaturation: metrics.mongoSaturation
        });

        // Heap Leak Warning (growth > 10% per hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const pastMetric = await SystemMetric.findOne({
            nodeId,
            createdAt: { $gte: oneHourAgo, $lte: new Date(Date.now() - 55 * 60 * 1000) }
        }).sort({ createdAt: -1 });

        if (pastMetric && pastMetric.heapUsed > 0) {
            const growth = ((heapUsed - pastMetric.heapUsed) / pastMetric.heapUsed) * 100;
            if (growth > 10) {
                const alertMsg = `[MemoryLeakWarning] Node ${nodeId} heap grew by ${growth.toFixed(1)}% in the last hour (Current: ${heapUsed}MB, 1h Ago: ${pastMetric.heapUsed}MB).`;
                console.warn(alertMsg);

                await sendSecurityAlert({
                    title: 'System Memory Leak Warning',
                    message: alertMsg,
                    risk: 'high',
                    event: 'HEAP_LEAK_WARNING',
                    details: { nodeId, growth, heapUsed, pastHeapUsed: pastMetric.heapUsed }
                });
            }
        }
    } catch (err) {
        console.error('[InfraMonitor-Telemetry] Error saving telemetry:', err.message);
    }
};

// Runs the infrastructure checks and flags violations
const checkInfrastructureHealth = async () => {
    try {
        const cpu = getCpuUsage();
        const memory = getMemoryUsage();
        const disk = getDiskUsage();
        const redisMem = await getRedisMemory();
        const mongoConns = await getMongoConnections();
        const mongoSaturation = await getMongoSaturation();

        // Query Redis memory percent & evictions count
        let redisMemoryPercent = 0;
        let redisEvictions = 0;
        let isEvicting = false;

        if (isRedisActive()) {
            try {
                const redis = getRedisClient();
                const memInfo = await redis.info('memory');
                const statsInfo = await redis.info('stats');

                const memMatch = memInfo.match(/used_memory:(\d+)/);
                const maxMatch = memInfo.match(/maxmemory:(\d+)/);
                const evictMatch = statsInfo.match(/evicted_keys:(\d+)/);

                if (memMatch && maxMatch) {
                    const used = parseInt(memMatch[1], 10);
                    const max = parseInt(maxMatch[1], 10);
                    if (max > 0) {
                        redisMemoryPercent = Math.round((used / max) * 100);
                    }
                }

                if (evictMatch) {
                    redisEvictions = parseInt(evictMatch[1], 10);
                    const prevEvictStr = await redis.get(`infra:prev_evictions:${process.pid}`);
                    const prevEvict = prevEvictStr ? parseInt(prevEvictStr, 10) : 0;
                    if (redisEvictions > prevEvict) {
                        isEvicting = true;
                    }
                    await redis.set(`infra:prev_evictions:${process.pid}`, redisEvictions.toString(), 'EX', 86400);
                }
            } catch (e) {}
        }

        const metrics = { cpu, memory, disk, redisMem, redisEvictions, mongoConns, mongoSaturation };

        // Save telemetry
        await recordSystemTelemetry(metrics);

        let alertReason = '';
        let breached = false;

        if (cpu > CPU_THRESHOLD) {
            alertReason += `CPU usage is high (${cpu}%). `;
            breached = true;
        }
        if (memory > MEMORY_THRESHOLD) {
            alertReason += `Memory usage is high (${memory}%). `;
            breached = true;
        }
        if (disk > DISK_THRESHOLD) {
            alertReason += `Disk usage is high (${disk}%). `;
            breached = true;
        }
        if (redisMemoryPercent > 80) {
            alertReason += `Redis memory percentage is high (${redisMemoryPercent}%). `;
            breached = true;
        }
        if (isEvicting) {
            alertReason += `Redis evicted keys are rising (Active Evictions). `;
            breached = true;
        }
        if (mongoConns > MONGO_CONN_THRESHOLD) {
            alertReason += `MongoDB connection pool size is high (${mongoConns} connections). `;
            breached = true;
        }
        if (mongoSaturation > 80) {
            alertReason += `MongoDB connection pool saturation is high (${mongoSaturation}%). `;
            breached = true;
        }

        if (breached) {
            await logSecurityEvent(null, 'system-monitor', 'INFRA_ALERT', null, {
                reason: alertReason.trim(),
                metrics
            });

            await sendSecurityAlert({
                title: 'Infrastructure Threshold Breached',
                message: alertReason.trim(),
                risk: 'high',
                event: 'INFRA_ALERT',
                details: metrics
            });
        }

        return metrics;
    } catch (err) {
        console.error('[InfraMonitor] Error checking infrastructure metrics:', err.message);
    }
};

// Heartbeat for cluster health reporting
const startHeartbeat = () => {
    if (!isRedisActive()) return;

    setInterval(async () => {
        try {
            const redis = getRedisClient();
            if (!redis) return;

            const cpu = getCpuUsage();
            const memory = getMemoryUsage();
            const disk = getDiskUsage();

            let socketCount = 0;
            try {
                const { getIO } = require('../config/socket');
                const io = getIO();
                if (io && io.sockets && io.sockets.sockets) {
                    socketCount = io.sockets.sockets.size || 0;
                }
            } catch (ioErr) {
                // socketCount remains 0 if socket is not initialized (e.g. worker process)
            }

            const stats = {
                pid: process.pid,
                cpu,
                memory,
                disk,
                socketCount,
                timestamp: Date.now()
            };

            await redis.set(`node:health:${process.pid}`, JSON.stringify(stats), 'EX', 15);
        } catch (err) {
            console.error('[InfraMonitor-Heartbeat] Failed to set health metrics:', err.message);
        }
    }, 5000);
};

// Setup background checker
let monitorIntervalId = null;

const startInfraMonitor = () => {
    if (monitorIntervalId) return;

    // Check every 60 seconds
    monitorIntervalId = setInterval(async () => {
        await checkInfrastructureHealth();
    }, 60000);

    // Start 5-second heartbeats for cluster coordination
    startHeartbeat();

    console.log('[InfraMonitor] Infrastructure monitoring started (checking every 60s, heartbeats every 5s)');
};

module.exports = {
    startInfraMonitor,
    checkInfrastructureHealth
};
