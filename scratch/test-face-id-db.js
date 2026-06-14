const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', 'backend', '.env') });

const User = require('../backend/models/User');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const users = await User.find({
        $or: [
            { email: /shashwat/i },
            { name: /shashwat/i },
            { email: /dixit/i }
        ]
    });
    console.log("Matching users in DB:", users.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        verificationStatus: u.verificationStatus,
        hasFaceData: !!u.faceData
    })));
    process.exit(0);
}

run().catch(console.error);
