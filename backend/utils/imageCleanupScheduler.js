const cron = require('node-cron');
const ImageListingSession = require('../models/ImageListingSession');
const cloudinary = require('../config/cloudinaryConfig');

// 4️⃣ CLEANUP STRATEGY (CRON / JOB)
// Runs daily at 3:00 AM
const startImageCleanupScheduler = () => {
    console.log('[Cleanup Scheduler] Initialized. running daily at 3 AM.');

    cron.schedule('0 3 * * *', async () => {
        console.log('[Cleanup Scheduler] Starting cleanup of abandoned image sessions...');

        try {
            // Find sessions active for more than 24 hours
            const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const oldSessions = await ImageListingSession.find({
                status: "active",
                updatedAt: { $lt: cutoffDate }
            });

            if (oldSessions.length === 0) {
                console.log('[Cleanup Scheduler] No abandoned sessions found.');
                return;
            }

            console.log(`[Cleanup Scheduler] Found ${oldSessions.length} sessions to clean.`);

            for (const session of oldSessions) {
                // Delete images from Cloudinary
                for (const item of session.items) {
                    if (item.imageUrl) {
                        try {
                            // Extract public_id from secure_url if possible, or assume simple handling
                            // Standard Cloudinary URL: https://res.cloudinary.com/.../shoplens/camera_uploads/filename.jpg
                            // We need 'shoplens/camera_uploads/filename'

                            const urlParts = item.imageUrl.split('/');
                            const filename = urlParts.pop().split('.')[0];
                            const folder = urlParts.pop(); // camera_uploads
                            const rootFolder = urlParts.pop(); // shoplens
                            const publicId = `${rootFolder}/${folder}/${filename}`;

                            await cloudinary.uploader.destroy(publicId);
                            console.log(`[Cleanup Scheduler] Deleted image: ${publicId}`);
                        } catch (err) {
                            console.error(`[Cleanup Scheduler] Failed to delete image ${item.imageUrl}:`, err.message);
                        }
                    }
                }

                // Mark session as abandoned (or delete if prefer hard delete)
                session.status = 'abandoned';
                await session.save();
                // await session.deleteOne(); // Option: Hard Delete
            }

            console.log('[Cleanup Scheduler] Cleanup complete.');

        } catch (error) {
            console.error('[Cleanup Scheduler] Error:', error);
        }
    });
};

module.exports = { startImageCleanupScheduler };
