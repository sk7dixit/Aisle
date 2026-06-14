const { Queue } = require('bullmq');
const { getRedisClient, isRedisActive } = require('./redis');
const { acquireLock } = require('../utils/lockManager');

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || 6379, 10),
    password: process.env.REDIS_PASSWORD || undefined
};

const defaultJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
};

// Create queues
const stockQueue = new Queue('stockQueue', { connection, defaultJobOptions });
const notificationQueue = new Queue('notificationQueue', { connection, defaultJobOptions });
const subscriptionQueue = new Queue('subscriptionQueue', { connection, defaultJobOptions });
const cleanupQueue = new Queue('cleanupQueue', { connection, defaultJobOptions });
const requestQueue = new Queue('requestQueue', { connection, defaultJobOptions });
const searchQueue = new Queue('searchQueue', { connection, defaultJobOptions });
const eventCalendarQueue = new Queue('eventCalendarQueue', { connection, defaultJobOptions });
const weatherIntelligenceQueue = new Queue('weatherIntelligenceQueue', { connection, defaultJobOptions });
const eventForecastQueue = new Queue('eventForecastQueue', { connection, defaultJobOptions });
const opportunityAlertQueue = new Queue('opportunityAlertQueue', { connection, defaultJobOptions });
const pricingIntelligenceQueue = new Queue('pricingIntelligenceQueue', { connection, defaultJobOptions });
const growthOpportunityQueue = new Queue('growthOpportunityQueue', { connection, defaultJobOptions });
const expansionAdvisorQueue = new Queue('expansionAdvisorQueue', { connection, defaultJobOptions });
const weeklyGrowthReportQueue = new Queue('weeklyGrowthReportQueue', { connection, defaultJobOptions });

const initQueues = async () => {
    let lock;
    try {
        if (isRedisActive()) {
            const redis = getRedisClient();
            
            // 1. Try to acquire the initialization lock
            try {
                lock = await acquireLock('lock:queue:init', 30000); // 30 seconds TTL
            } catch (lockErr) {
                console.log('[BullMQ] Queue initialization lock is held by another node cluster. Skipping registration.');
                return;
            }

            // 2. Check if already initialized by another node cluster
            const initialized = await redis.get('queues:initialized');
            if (initialized) {
                console.log('[BullMQ] Queues already initialized by another node cluster. Skipping registration.');
                await lock.release().catch(() => {});
                return;
            }
        }

        // Clear old repeatable jobs first to avoid duplicate configurations on hot reload
        const queues = [
            stockQueue, notificationQueue, subscriptionQueue, cleanupQueue, requestQueue, searchQueue,
            eventCalendarQueue, weatherIntelligenceQueue, eventForecastQueue, opportunityAlertQueue,
            pricingIntelligenceQueue, growthOpportunityQueue, expansionAdvisorQueue, weeklyGrowthReportQueue
        ];
        for (const q of queues) {
            const repeatableJobs = await q.getRepeatableJobs();
            for (const r of repeatableJobs) {
                await q.removeRepeatableByKey(r.key);
            }
        }

        // Register repeatable cron-like jobs
        
        // Stock Reset: Daily at 11:59 PM
        await stockQueue.add('performDailyReset', {}, {
            repeat: { pattern: '59 23 * * *' }
        });

        // Notification Reminders
        await notificationQueue.add('stockUpdateReminder', {}, {
            repeat: { pattern: '0 */6 * * *' }
        });
        await notificationQueue.add('dailyAddProductReminder', {}, {
            repeat: { pattern: '30 10 * * *' }
        });
        await notificationQueue.add('dailyShopVisitSummary', {}, {
            repeat: { pattern: '0 21 * * *' }
        });
        await notificationQueue.add('greetingScheduler', {}, {
            repeat: { pattern: '*/5 * * * *' }
        });
        await notificationQueue.add('dailySafetyCleanup', {}, {
            repeat: { pattern: '0 3 * * *' }
        });
        await notificationQueue.add('processFailedEmails', {}, {
            repeat: { pattern: '*/5 * * * *' }
        });

        // Subscription Check: Daily at 12:00 AM midnight
        await subscriptionQueue.add('dailySubscriptionCheck', {}, {
            repeat: { pattern: '0 0 * * *' }
        });

        // Image Cleanup: Daily at 3:00 AM
        await cleanupQueue.add('dailyImageCleanup', {}, {
            repeat: { pattern: '0 3 * * *' }
        });

        // Request Expiry Check: Every 10 seconds
        await requestQueue.add('requestExpiryCheck', {}, {
            repeat: { every: 10000 }
        });

        // Search Precomputation: Every 10 minutes
        await searchQueue.add('precomputeSearchData', {}, {
            repeat: { pattern: '*/10 * * * *' }
        });

        // Shop Status Sync: Every 5 minutes
        await searchQueue.add('syncShopStatus', {}, {
            repeat: { pattern: '*/5 * * * *' }
        });

        // Daily Trend Aggregation: Every Hour
        await searchQueue.add('aggregateTrends', {}, {
            repeat: { pattern: '0 * * * *' }
        });

        // Daily Demand History Aggregation: 12:00 AM
        await searchQueue.add('aggregateDemandHistory', {}, {
            repeat: { pattern: '0 0 * * *' }
        });

        // Daily Demand Forecast Generation: 1:00 AM
        await searchQueue.add('generateDemandForecasts', {}, {
            repeat: { pattern: '0 1 * * *' }
        });

        // Daily Forecast Accuracy Evaluation: 2:00 AM
        await searchQueue.add('evaluateForecastAccuracy', {}, {
            repeat: { pattern: '0 2 * * *' }
        });

        // Daily Inventory Levels Snapshot: 11:45 PM
        await searchQueue.add('snapshotInventoryLevels', {}, {
            repeat: { pattern: '45 23 * * *' }
        });

        // Daily Inventory Forecast Generation: 1:30 AM
        await searchQueue.add('generateInventoryForecasts', {}, {
            repeat: { pattern: '30 1 * * *' }
        });

        // Daily Revenue History Aggregation: 12:00 AM
        await searchQueue.add('aggregateDailyRevenue', {}, {
            repeat: { pattern: '0 0 * * *' }
        });

        // Daily Revenue Forecast Generation: 1:45 AM
        await searchQueue.add('generateRevenueForecasts', {}, {
            repeat: { pattern: '45 1 * * *' }
        });

        // Daily Business Health Scorer: 2:15 AM
        await searchQueue.add('calculateBusinessHealth', {}, {
            repeat: { pattern: '15 2 * * *' }
        });

        // Daily Revenue Opportunity/Risk Alerts: 2:45 AM
        await searchQueue.add('dispatchRevenueAlerts', {}, {
            repeat: { pattern: '45 2 * * *' }
        });

        // Hyperlocal Scheduling (Task 4)
        await searchQueue.add('aggregateAreaIntelligence', {}, {
            repeat: { pattern: '30 2 * * *' }
        });
        await searchQueue.add('calculateAreaTrends', {}, {
            repeat: { pattern: '15 3 * * *' }
        });
        await searchQueue.add('detectAreaGaps', {}, {
            repeat: { pattern: '30 3 * * *' }
        });

        // Event Intelligence Scheduling (Task 5)
        await eventCalendarQueue.add('syncEventCalendar', {}, {
            repeat: { pattern: '0 1 * * *' }
        });
        await weatherIntelligenceQueue.add('syncWeatherForecast', {}, {
            repeat: { pattern: '0 * * * *' }
        });
        await eventForecastQueue.add('calculateEventForecasts', {}, {
            repeat: { pattern: '0 2 * * *' }
        });
        await opportunityAlertQueue.add('checkOpportunityAlerts', {}, {
            repeat: { pattern: '0 3 * * *' }
        });

        // Growth & Pricing Advisor Scheduling (Task 6)
        await pricingIntelligenceQueue.add('syncPricingIntelligence', {}, {
            repeat: { pattern: '0 * * * *' } // hourly
        });
        await growthOpportunityQueue.add('syncGrowthOpportunities', {}, {
            repeat: { pattern: '0 2 * * *' } // daily at 2:00 AM
        });
        await expansionAdvisorQueue.add('syncExpansionAdvisories', {}, {
            repeat: { pattern: '0 3 * * *' } // daily at 3:00 AM
        });
        await weeklyGrowthReportQueue.add('syncWeeklyGrowthReport', {}, {
            repeat: { pattern: '0 4 * * 0' } // weekly on Sunday at 4:00 AM
        });

        // 3. Mark as initialized in Redis (with 1-hour TTL to allow reset on restarts)
        if (isRedisActive()) {
            const redis = getRedisClient();
            await redis.set('queues:initialized', 'true', 'EX', 3600);
        }

        console.log('[BullMQ] Queues initialized and repeatable jobs registered successfully');
    } catch (err) {
        console.error('[BullMQ] Queue initialization error:', err.message);
    } finally {
        if (lock) {
            await lock.release().catch(() => {});
        }
    }
};

module.exports = {
    stockQueue,
    notificationQueue,
    subscriptionQueue,
    cleanupQueue,
    requestQueue,
    searchQueue,
    eventCalendarQueue,
    weatherIntelligenceQueue,
    eventForecastQueue,
    opportunityAlertQueue,
    pricingIntelligenceQueue,
    growthOpportunityQueue,
    expansionAdvisorQueue,
    weeklyGrowthReportQueue,
    initQueues
};
