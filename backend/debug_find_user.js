const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const findUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'shashwatdixit22@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('USER_FOUND:', JSON.stringify({
                _id: user._id,
                email: user.email,
                role: user.role,
                verificationStatus: user.verificationStatus,
                hasFaceData: !!user.faceData
            }, null, 2));
        } else {
            console.log('USER_NOT_FOUND:', email);
            const allUsers = await User.find({}).select('email role');
            console.log('ALL_USERS:', JSON.stringify(allUsers, null, 2));
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

findUser();
