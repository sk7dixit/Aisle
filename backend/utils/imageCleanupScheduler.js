const cron = require('node-cron');
const ImageListingSession = require('../models/ImageListingSession');
const cloudinary = require('../config/cloudinaryConfig');
const { runDataRetentionPurge } = require('../services/dataRetentionService');

const performImageCleanup = async () => {
    console.log('[Job] Starting cleanup of abandoned image sessions...');
    try {
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const oldSessions = await ImageListingSession.find({
            status: "active",
            updatedAt: { $lt: cutoffDate }
        });

        if (oldSessions.length > 0) {
            console.log(`[Cleanup Job] Found ${oldSessions.length} sessions to clean.`);

            for (const session of oldSessions) {
                for (const item of session.items) {
                    if (item.imageUrl) {
                        try {
                            const urlParts = item.imageUrl.split('/');
                            const filename = urlParts.pop().split('.')[0];
                            const folder = urlParts.pop();
                            const rootFolder = urlParts.pop();
                            const publicId = `${rootFolder}/${folder}/${filename}`;

                            await cloudinary.uploader.destroy(publicId);
                            console.log(`[Cleanup Job] Deleted image: ${publicId}`);
                        } catch (err) {
                            console.error(`[Cleanup Job] Failed to delete image ${item.imageUrl}:`, err.message);
                        }
                    }
                }

                session.status = 'abandoned';
                await session.save();
            }
        } else {
            console.log('[Cleanup Job] No abandoned sessions found.');
        }

        console.log('[Cleanup Job] Session image cleanup complete.');

        // Trigger data retention purging
        await runDataRetentionPurge();

    } catch (error) {
        console.error('[Cleanup Job Error] Error:', error);
        throw error;
    }
};

const startImageCleanupScheduler = () => {
    if (process.env.DISABLE_SCHEDULERS === 'true' || process.env.NODE_ENV === 'production') {
        console.log('[Cleanup Scheduler] Running via background workers.');
        return;
    }

    console.log('[Cleanup Scheduler] Initialized. running daily at 3 AM.');
    cron.schedule('0 3 * * *', performImageCleanup);
};

module.exports = { startImageCleanupScheduler, performImageCleanup };
