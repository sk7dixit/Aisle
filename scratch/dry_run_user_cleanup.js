const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

const WHITELIST_EMAILS = [
    'shashwatdixit22@gmail.com',
    'shashwatdixit033@gmail.com',
    'shashwatdixit33@gmail.com',
    'learnify887@gmail.com',
    'kallbharav7065@gmail.com',
    'trinovex@gmail.com',
    'shoplens017@gmail.com'
];

async function run() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        console.log("Fetching all users...");
        const allUsers = await User.find({});
        console.log(`Fetched ${allUsers.length} total users.`);

        const toKeep = [];
        const toDelete = [];

        allUsers.forEach(u => {
            const email = (u.email || '').toLowerCase().trim();
            const name = u.name || '';
            
            // Check if matches whitelist
            const isWhitelisted = WHITELIST_EMAILS.some(w => email === w.toLowerCase().trim()) || 
                                  email.includes('shashwat') || 
                                  email.includes('dixit');
            
            if (isWhitelisted) {
                toKeep.push(u);
            } else {
                toDelete.push(u);
            }
        });

        console.log(`\n--- USERS TO KEEP (Count: ${toKeep.length}) ---`);
        toKeep.forEach((u, i) => {
            console.log(`  ${i+1}. Name: "${u.name}" | Email: "${u.email}" | Role: "${u.role}" | ID: ${u._id}`);
        });

        console.log(`\n--- USERS TO DELETE (Count: ${toDelete.length}) ---`);
        console.log(`  First 10:`);
        toDelete.slice(0, 10).forEach((u, i) => {
            console.log(`  ${i+1}. Name: "${u.name}" | Email: "${u.email}" | Role: "${u.role}" | ID: ${u._id}`);
        });
        console.log(`  ... and ${toDelete.length - 10} more users to delete.`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
