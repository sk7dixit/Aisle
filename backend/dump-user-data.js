const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            tls: true, // Re-enable for Atlas
            tlsAllowInvalidCertificates: true,
            serverSelectionTimeoutMS: 5000,
            family: 4
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        fs.writeFileSync('debug-output.txt', `DB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();
    try {
        const user = await User.findOne({ email: 'shashwatdixit33@gmail.com' });
        const output = user ? JSON.stringify(user, null, 2) : 'User not found';
        fs.writeFileSync('debug-output.txt', output);
        console.log('Data written to debug-output.txt');
    } catch (error) {
        fs.writeFileSync('debug-output.txt', `Query Error: ${error.message}`);
    } finally {
        process.exit();
    }
};

run();
