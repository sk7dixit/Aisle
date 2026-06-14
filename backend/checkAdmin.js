const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');


const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aisle');
        console.log('MongoDB Connected');
        
        // Find the user
        const email = 'shoplens017@gmail.com';
        console.log('Searching for email:', email);
        const { encryptDeterministic } = require('./utils/encryption');
        console.log('checkAdmin deterministic email encryption output:', encryptDeterministic(email));
        
        // Let's find by exact email (Mongoose setter should encrypt it)
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found by mongoose findOne.');
            
            // Let's list all users to see what's in the DB
            const allUsers = await User.find({});
            console.log('Total users in database:', allUsers.length);
            allUsers.forEach(u => {
                console.log(`- ID: ${u._id}, Role: ${u.role}, Email (decrypted/getter): ${u.email}`);
            });
        } else {
            console.log('User found:', {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                passwordHash: user.password
            });
            
            const isMatch = await user.matchPassword('Admin@123');
            console.log('Password "Admin@123" matches?', isMatch);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

check();
