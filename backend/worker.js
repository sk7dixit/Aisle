const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') }); // Must be first

process.env.IS_WORKER = 'true';

const connectDB = require('./config/db');
const { Worker } = require('bullmq');
const DeadLetterJob = require('./models/DeadLetterJob');
const { sendSecurityAlert } = require('./utils/alertDispatcher');

// Import job functions
const { performDailyReset } = require('./utils/stockScheduler');
const {
    checkStockUpdateReminders,
    checkProductAdditionReminders,
    checkShopVisitSummaries,
    checkGreetings,
    checkSafetyCleanup,
    processFailedEmails
} = require('./utils/notificationScheduler');
const { checkSubscriptionExpiries } = require('./utils/subscriptionScheduler');
const { performImageCleanup } = require('./utils/imageCleanupScheduler');
const { performRequestExpiryCheck } = require('./services/requestScheduler');
const { syncShopStatus } = require('./utils/shopStatusScheduler');
const { precomputeSearchData } = require('./utils/searchPrecomputer');

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || 6379, 10),
    password: process.env.REDIS_PASSWORD || undefined
};

// Common options with retry defaults
const workerOptions = {
    connection,
    concurrency: 1, // Process sequentially per worker to prevent DB race conditions
    limiter: {
        max: 5,
        duration: 1000
    }
};

const handleJobFailure = async (job, err, queueName) => {
    console.error(`[Worker Error] Job ${job.id} (${job.name}) failed in queue ${queueName}:`, err.message);
    
    // Check if it reached max retry attempts
    const maxRetries = job.opts.attempts || 3;
    if (job.attemptsMade >= maxRetries) {
        console.warn(`[DLQ] Job ${job.id} reached max retries (${maxRetries}). Moving to Dead Letter Queue.`);
        try {
            await DeadLetterJob.create({
                queueName,
                jobId: job.id,
                jobName: job.name,
                data: job.data,
                failedReason: err.message,
                stacktrace: err.stack ? [err.stack] : []
            });

            await sendSecurityAlert({
                title: 'Background Job Permanently Failed (DLQ)',
                message: `Job '${job.name}' (ID: ${job.id}) in queue '${queueName}' failed permanently: ${err.message}`,
                risk: 'high',
                event: 'BACKGROUND_JOB_DLQ',
                details: { jobId: job.id, queueName, failedReason: err.message }
            });
        } catch (dbErr) {
            console.error('[DLQ] Failed to write dead letter job to database:', dbErr.message);
        }
    }
};

const startWorkers = async () => {
    // 1. Stock Worker
    const stockWorker = new Worker('stockQueue', async (job) => {
        if (job.name === 'performDailyReset') {
            await performDailyReset();
        }
    }, workerOptions);

    // 2. Notification Worker
    const notificationWorker = new Worker('notificationQueue', async (job) => {
        switch (job.name) {
            case 'stockUpdateReminder':
                await checkStockUpdateReminders();
                break;
            case 'dailyAddProductReminder':
                await checkProductAdditionReminders();
                break;
            case 'dailyShopVisitSummary':
                await checkShopVisitSummaries();
                break;
            case 'greetingScheduler':
                await checkGreetings();
                break;
            case 'dailySafetyCleanup':
                await checkSafetyCleanup();
                break;
            case 'processFailedEmails':
                await processFailedEmails();
                break;
            case 'dispatchNotification':
                const { sendNotification } = require('./services/notificationService');
                const { sellerId, type, payload } = job.data;
                await sendNotification(sellerId, type, payload, true);
                break;
            default:
                console.warn(`Unknown job name: ${job.name}`);
        }
    }, {
        ...workerOptions,
        settings: {
            backoff: {
                type: 'exponential',
                delay: 5000 // 5 seconds initial delay
            }
        }
    });

    // 3. Subscription Worker
    const subscriptionWorker = new Worker('subscriptionQueue', async (job) => {
        if (job.name === 'dailySubscriptionCheck') {
            await checkSubscriptionExpiries();
        }
    }, workerOptions);

    // 4. Cleanup Worker
    const cleanupWorker = new Worker('cleanupQueue', async (job) => {
        if (job.name === 'dailyImageCleanup') {
            await performImageCleanup();
        }
    }, workerOptions);

    // 5. Request Worker
    const requestWorker = new Worker('requestQueue', async (job) => {
        if (job.name === 'requestExpiryCheck') {
            await performRequestExpiryCheck();
        }
    }, workerOptions);

    // 6. Search Worker
    const searchWorker = new Worker('searchQueue', async (job) => {
        if (job.name === 'precomputeSearchData') {
            await precomputeSearchData();
        } else if (job.name === 'syncShopStatus') {
            await syncShopStatus();
        } else if (job.name === 'syncProductIndex') {
            const { productId, action } = job.data;
            console.log(`[Worker] Running syncProductIndex for product: ${productId}, action: ${action}`);
            // In a real environment, sync with Atlas Search index.
            // Here, we simulate by logging the sync action.
            const searchCache = require('./utils/searchCache');
            await searchCache.clear();
        } else if (job.name === 'aggregateTrends') {
            const { aggregateSearchTrends } = require('./services/trendAggregationService');
            await aggregateSearchTrends();

            // Task 3: Calculate seller intelligence and recommendations for all active sellers
            console.log('[Worker] Starting Seller Intelligence calculation for all active sellers...');
            const User = require('./models/User');
            const { calculateSellerIntelligence, generateSellerRecommendations } = require('./services/sellerIntelligenceService');
            const sellers = await User.find({ role: 'seller', accountStatus: 'active' });
            for (const seller of sellers) {
                try {
                    await calculateSellerIntelligence(seller._id);
                    await generateSellerRecommendations(seller._id);
                } catch (err) {
                    console.error(`[Worker] Failed to process intelligence for seller ${seller._id}:`, err.message);
                }
            }
            console.log(`[Worker] Finished Seller Intelligence calculation for ${sellers.length} sellers.`);

            // Task 5: Refresh customer recommendation caches & run re-engagement checks
            console.log('[Worker] Starting customer personalization cache updates and re-engagement checks...');
            const { refreshAllCustomerCaches, runReEngagementCheck } = require('./services/personalizationService');
            try {
                await refreshAllCustomerCaches();
                await runReEngagementCheck();
            } catch (err) {
                console.error('[Worker] Failed to run customer personalization updates:', err.message);
            }
            console.log('[Worker] Finished customer personalization updates.');
        } else if (job.name === 'aggregateDemandHistory') {
            const { aggregateDailyDemand } = require('./services/forecastService');
            await aggregateDailyDemand();
        } else if (job.name === 'generateDemandForecasts') {
            const { generateForecasts } = require('./services/forecastService');
            await generateForecasts();
        } else if (job.name === 'evaluateForecastAccuracy') {
            const { evaluateAccuracy } = require('./services/forecastService');
            await evaluateAccuracy();
        } else if (job.name === 'snapshotInventoryLevels') {
            const { snapshotInventory } = require('./services/inventoryForecastService');
            await snapshotInventory();
        } else if (job.name === 'generateInventoryForecasts') {
            const { generateInventoryForecasts } = require('./services/inventoryForecastService');
            await generateInventoryForecasts();
        } else if (job.name === 'aggregateDailyRevenue') {
            const { aggregateDailyRevenue } = require('./services/revenueIntelligenceService');
            await aggregateDailyRevenue();
        } else if (job.name === 'generateRevenueForecasts') {
            const User = require('./models/User');
            const { generateRevenueForecasts } = require('./services/revenueIntelligenceService');
            const sellers = await User.find({ role: 'seller' });
            for (const s of sellers) {
                await generateRevenueForecasts(s._id).catch(err => console.error(`[Worker] Failed forecast for ${s._id}:`, err.message));
            }
        } else if (job.name === 'calculateBusinessHealth') {
            const User = require('./models/User');
            const { calculateBusinessHealth } = require('./services/revenueIntelligenceService');
            const sellers = await User.find({ role: 'seller' });
            for (const s of sellers) {
                await calculateBusinessHealth(s._id).catch(err => console.error(`[Worker] Failed health for ${s._id}:`, err.message));
            }
        } else if (job.name === 'dispatchRevenueAlerts') {
            const User = require('./models/User');
            const { dispatchRevenueAlerts } = require('./services/revenueIntelligenceService');
            const sellers = await User.find({ role: 'seller' });
            for (const s of sellers) {
                await dispatchRevenueAlerts(s._id).catch(err => console.error(`[Worker] Failed alerts for ${s._id}:`, err.message));
            }
        } else if (job.name === 'aggregateAreaIntelligence') {
            const { aggregateAreaIntelligence } = require('./services/hyperlocalIntelligenceService');
            await aggregateAreaIntelligence();
        } else if (job.name === 'calculateAreaTrends') {
            const { calculateAreaTrends } = require('./services/hyperlocalIntelligenceService');
            await calculateAreaTrends();
        } else if (job.name === 'detectAreaGaps') {
            const { detectAreaGaps } = require('./services/hyperlocalIntelligenceService');
            await detectAreaGaps();
        }
    }, workerOptions);

    // Event Intelligence Workers (Task 5)
    const eventCalendarWorker = new Worker('eventCalendarQueue', async (job) => {
        if (job.name === 'syncEventCalendar') {
            const { syncEventCalendarJob } = require('./services/eventIntelligenceService');
            await syncEventCalendarJob();
        }
    }, workerOptions);

    const weatherIntelligenceWorker = new Worker('weatherIntelligenceQueue', async (job) => {
        if (job.name === 'syncWeatherForecast') {
            const { syncWeatherForecastJob } = require('./services/eventIntelligenceService');
            await syncWeatherForecastJob();
        }
    }, workerOptions);

    const eventForecastWorker = new Worker('eventForecastQueue', async (job) => {
        if (job.name === 'calculateEventForecasts') {
            const { calculateEventForecastsJob } = require('./services/eventIntelligenceService');
            await calculateEventForecastsJob();
        }
    }, workerOptions);

    const opportunityAlertWorker = new Worker('opportunityAlertQueue', async (job) => {
        if (job.name === 'checkOpportunityAlerts') {
            const { checkOpportunityAlertsJob } = require('./services/eventIntelligenceService');
            await checkOpportunityAlertsJob();
        }
    }, workerOptions);

    // Pricing and Growth Advisor Workers (Task 6)
    const pricingIntelligenceWorker = new Worker('pricingIntelligenceQueue', async (job) => {
        if (job.name === 'syncPricingIntelligence') {
            const { syncPricingIntelligenceJob } = require('./services/growthAdvisorService');
            await syncPricingIntelligenceJob();
        }
    }, workerOptions);

    const growthOpportunityWorker = new Worker('growthOpportunityQueue', async (job) => {
        if (job.name === 'syncGrowthOpportunities') {
            const { syncGrowthOpportunitiesJob } = require('./services/growthAdvisorService');
            await syncGrowthOpportunitiesJob();
        }
    }, workerOptions);

    const expansionAdvisorWorker = new Worker('expansionAdvisorQueue', async (job) => {
        if (job.name === 'syncExpansionAdvisories') {
            const { syncExpansionAdvisoriesJob } = require('./services/growthAdvisorService');
            await syncExpansionAdvisoriesJob();
        }
    }, workerOptions);

    const weeklyGrowthReportWorker = new Worker('weeklyGrowthReportQueue', async (job) => {
        if (job.name === 'syncWeeklyGrowthReport') {
            const { syncWeeklyGrowthReportJob } = require('./services/growthAdvisorService');
            await syncWeeklyGrowthReportJob();
        }
    }, workerOptions);

    const workersList = [
        { worker: stockWorker, name: 'stockQueue' },
        { worker: notificationWorker, name: 'notificationQueue' },
        { worker: subscriptionWorker, name: 'subscriptionQueue' },
        { worker: cleanupWorker, name: 'cleanupQueue' },
        { worker: requestWorker, name: 'requestQueue' },
        { worker: searchWorker, name: 'searchQueue' },
        { worker: eventCalendarWorker, name: 'eventCalendarQueue' },
        { worker: weatherIntelligenceWorker, name: 'weatherIntelligenceQueue' },
        { worker: eventForecastWorker, name: 'eventForecastQueue' },
        { worker: opportunityAlertWorker, name: 'opportunityAlertQueue' },
        { worker: pricingIntelligenceWorker, name: 'pricingIntelligenceQueue' },
        { worker: growthOpportunityWorker, name: 'growthOpportunityQueue' },
        { worker: expansionAdvisorWorker, name: 'expansionAdvisorQueue' },
        { worker: weeklyGrowthReportWorker, name: 'weeklyGrowthReportQueue' }
    ];

    workersList.forEach(({ worker, name }) => {
        worker.on('failed', (job, err) => handleJobFailure(job, err, name));
        worker.on('completed', (job) => {
            console.log(`[Worker] Job ${job.id} (${job.name}) completed successfully in queue ${name}`);
        });
        worker.on('error', (err) => {
            console.error(`[Worker Connection Error] Error in queue ${name}:`, err.message);
        });
    });

    console.log('[Worker Systems] All BullMQ Background Workers initialized successfully');
};

connectDB().then(() => {
    startWorkers();
});
