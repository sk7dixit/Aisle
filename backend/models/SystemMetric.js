const mongoose = require('mongoose');

const systemMetricSchema = new mongoose.Schema(
    {
        nodeId: {
            type: String,
            required: true,
            index: true
        },
        rss: {
            type: Number,
            required: true
        },
        heapTotal: {
            type: Number,
            required: true
        },
        heapUsed: {
            type: Number,
            required: true
        },
        external: {
            type: Number,
            required: true
        },
        cpuUsage: {
            type: Number,
            default: 0
        },
        socketCount: {
            type: Number,
            default: 0
        },
        redisMemoryUsage: {
            type: Number,
            default: 0
        },
        redisEvictions: {
            type: Number,
            default: 0
        },
        mongoConnections: {
            type: Number,
            default: 0
        },
        mongoSaturation: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// TTL Index to automatically delete metrics older than 30 days (2592000 seconds)
systemMetricSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const SystemMetric = mongoose.model('SystemMetric', systemMetricSchema);

module.exports = SystemMetric;
