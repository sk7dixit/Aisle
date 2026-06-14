const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const seedModerator = async () => {
    try {
        const moderatorEmail = 'trinovex@gmail.com';

        // Check if user exists
        const userExists = await User.findOne({ email: moderatorEmail });

        if (userExists) {
            console.log('Moderator already exists');
            userExists.role = 'moderator'; // Ensure role is updated if it was different
            userExists.password = 'Admin#123'; // Reset password to ensure it matches
            await userExists.save();
            console.log('Moderator role/password updated');
        } else {
            const user = await User.create({
                name: 'App Moderator',
                email: moderatorEmail,
                password: 'Admin#123',
                role: 'moderator',
                phone: '9999999999'
            });
            console.log(`Moderator created: ${user.name}`);
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedModerator();
