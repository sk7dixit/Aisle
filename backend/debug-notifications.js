const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Notification = require('./models/Notification');
const connectDB = require('./config/db');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const debugNotifications = async () => {
    try {
        await connectDB();

        console.log("--- USERS ---");
        const users = await User.find({}, 'name email role');
        users.forEach(u => console.log(`${u._id}: ${u.email} (${u.role})`));

        console.log("\n--- NOTIFICATIONS ---");
        const notifications = await Notification.find({}).sort({ createdAt: -1 });
        if (notifications.length === 0) {
            console.log("No notifications found in database.");
        } else {
            notifications.forEach(n => {
                console.log(`[${n.priority}] ${n.title} -> Recipient: ${n.recipientId} (Read: ${n.isRead})`);
            });
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debugNotifications();
