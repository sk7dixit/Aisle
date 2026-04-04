const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Notification = require('./models/Notification');
const connectDB = require('./config/db');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const resetNotifications = async () => {
    try {
        await connectDB();

        // Find the specific user shashwatdixit33@gmail.com
        const user = await User.findOne({ email: 'shashwatdixit33@gmail.com' });

        if (!user) {
            console.log("User not found!");
            process.exit(1);
        }

        console.log(`Resetting notifications for ${user.email} (${user._id})...`);

        // Delete existing notifications for this user
        await Notification.deleteMany({ recipientId: user._id });

        // Create FRESH notifications
        const notifications = [
            {
                type: 'REQUEST',
                title: 'New Request: Organic Tools',
                message: 'Customer nearby is looking for "Organic Gardening Tools".',
                priority: 'HIGH',
                isRead: false,
                createdAt: new Date()
            },
            {
                type: 'SYSTEM',
                title: 'Profile Verified',
                message: 'Your seller profile has been successfully verified! You can now access all features.',
                priority: 'MEDIUM',
                isRead: true, // A read notification for history
                createdAt: new Date(Date.now() - 86400000) // Yesterday
            },
            {
                type: 'INVENTORY',
                title: 'Low Stock Alert',
                message: 'Item "Basmati Rice 5kg" is running low.',
                priority: 'MEDIUM',
                isRead: false,
                createdAt: new Date(Date.now() - 3600000) // 1 hour ago
            }
        ];

        for (const n of notifications) {
            await Notification.create({
                recipientId: user._id,
                recipientRole: 'seller',
                ...n
            });
        }

        console.log(`Created ${notifications.length} notifications.`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetNotifications();
