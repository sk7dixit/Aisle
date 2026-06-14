const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const User = require('../backend/models/User');
const { decrypt } = require('../backend/utils/encryption');

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully.');

        const users = await User.find({}).lean();
        console.log(`Total users found: ${users.length}`);
        
        users.forEach((user, idx) => {
            console.log(`[${idx + 1}] ID: ${user._id}`);
            console.log(`    Name: ${user.name}`);
            console.log(`    Email (Decrypted): ${decrypt(user.email)}`);
            console.log(`    Mobile (Decrypted): ${decrypt(user.mobile || user.phone)}`);
            console.log(`    Role: ${user.role}`);
            console.log(`    Verified: ${user.isVerified}`);
            console.log(`    Created At: ${user.createdAt}`);
            console.log(`    Status: ${user.verificationStatus}`);
            console.log('----------------------------------------------------');
        });

    } catch (err) {
        console.error('Error in script:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

run();
