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

        console.log("Fetching all users from database...");
        const allUsers = await User.find({});
        console.log(`Fetched ${allUsers.length} total users.`);

        const shashwatUsers = [];
        const testUsers = [];
        const otherUsers = [];

        allUsers.forEach(u => {
            const email = u.email || '';
            const name = u.name || '';
            
            if (email.includes('shashwat') || email.includes('dixit')) {
                shashwatUsers.push(u);
            } else if (email.includes('test') || email.includes('fake') || email.includes('demo') || email.includes('@aisle.') || name.includes('cert_test') || name.includes('hardening_test')) {
                testUsers.push(u);
            } else {
                otherUsers.push(u);
            }
        });

        console.log(`\n--- Shashwat Users (Count: ${shashwatUsers.length}) ---`);
        shashwatUsers.forEach((u, i) => {
            console.log(`  ${i+1}. Name: "${u.name}" | Email: "${u.email}" | Role: "${u.role}" | ID: ${u._id}`);
        });

        console.log(`\n--- Test/Fake Users (Count: ${testUsers.length}) ---`);
        testUsers.slice(0, 15).forEach((u, i) => {
            console.log(`  ${i+1}. Name: "${u.name}" | Email: "${u.email}" | Role: "${u.role}" | ID: ${u._id}`);
        });
        if (testUsers.length > 15) {
            console.log(`  ... and ${testUsers.length - 15} more test users`);
        }

        console.log(`\n--- Other Users (Count: ${otherUsers.length}) ---`);
        otherUsers.slice(0, 15).forEach((u, i) => {
            console.log(`  ${i+1}. Name: "${u.name}" | Email: "${u.email}" | Role: "${u.role}" | ID: ${u._id}`);
        });
        if (otherUsers.length > 15) {
            console.log(`  ... and ${otherUsers.length - 15} more other users`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
