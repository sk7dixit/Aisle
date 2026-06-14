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

        const totalUsers = await User.countDocuments({});
        console.log(`\nTotal Users in database: ${totalUsers}`);

        const roles = await User.distinct('role');
        console.log(`Roles found:`, roles);

        for (const role of roles) {
            const count = await User.countDocuments({ role });
            console.log(`- Role '${role}': ${count} users`);
        }

        console.log(`\n--- Active Users by Status ---`);
        const statuses = await User.distinct('status');
        for (const status of statuses) {
            const count = await User.countDocuments({ status });
            console.log(`- Status '${status}': ${count} users`);
        }

        // Print details of a few users
        console.log(`\n--- Sample Users ---`);
        const samples = await User.find({}).limit(5);
        samples.forEach((u, idx) => {
            console.log(`  ${idx + 1}. Name: "${u.name}" | Email: "${u.email}" | Role: "${u.role}" | Status: "${u.status || 'N/A'}"`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
