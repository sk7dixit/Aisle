const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function run() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        // We find users that might be created by AI/testing.
        // Let's check users that do not contain "shashwat" in their email.
        const nonShashwatUsers = await User.find({
            email: { $not: /shashwat/i }
        }).sort({ createdAt: 1 });
        
        console.log(`\nFound ${nonShashwatUsers.length} users whose email does NOT contain 'shashwat':`);
        nonShashwatUsers.forEach((u, i) => {
            console.log(`${i + 1}. Name: "${u.name}" | Email: "${u.email}" | Role: "${u.role}" | CreatedAt: ${u.createdAt}`);
        });

        // Let's also check users that DO contain "shashwat" to see how many there are and who they are.
        const shashwatUsersCount = await User.countDocuments({
            email: /shashwat/i
        });
        console.log(`\nTotal users whose email contains 'shashwat': ${shashwatUsersCount}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
