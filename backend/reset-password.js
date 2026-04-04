const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const resetPassword = async () => {
    await connectDB();

    const email = 'shashwatdixit22@gmail.com';
    const newPassword = 'Msd@123';

    try {
        const user = await User.findOne({ email });

        if (user) {
            user.password = newPassword;
            await user.save();
            console.log(`Password updated successfully for ${email}`);
        } else {
            console.log(`User not found: ${email}`);
        }
    } catch (error) {
        console.error(`Error updating password: ${error.message}`);
    } finally {
        mongoose.disconnect();
        process.exit();
    }
};

resetPassword();
