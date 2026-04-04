const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const { sendNotification, NOTIFICATION_TYPE } = require('../services/notificationService');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const trigger = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // Find the most recently created seller to test with
        const seller = await User.findOne({ role: 'seller' }).sort({ createdAt: -1 });

        if (!seller) {
            console.log('No seller found to notify.');
            process.exit(1);
        }

        console.log(`Sending test notification to: ${seller.name} (${seller._id})`);

        // Force send a "System Info" notification manually
        // Use a generic type or one of the existing defined ones
        await sendNotification(seller._id, NOTIFICATION_TYPE.SYSTEM_SHOP_DAY_GREETING, {
            title: 'Test Notification',
            message: 'This is a test message to verify your notification panel is working correctly.'
        });

        console.log('Notification sent successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

trigger();
