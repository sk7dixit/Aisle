const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Adjust path if needed
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shoplens');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedAdmins = async () => {
    await connectDB();

    const admins = [
        {
            name: "Super Admin",
            email: "shoplens017@gmail.com",
            password: "Admin@123", // Updated as per user request
            role: "super_admin",
            phone: "+919999999999"
        },
        {
            name: "Moderator",
            email: "lakshyadwivedi2005@gmail.com",
            password: "Admin#123", // Updated as per user request
            role: "moderator",
            phone: "+918888888888"
        }
    ];

    for (const admin of admins) {
        const userExists = await User.findOne({ email: admin.email });
        if (userExists) {
            console.log(`User ${admin.email} already exists. Updating role and password...`);
            userExists.role = admin.role;
            userExists.password = admin.password; // This triggers the pre-save hook because it's modified
            await userExists.save();
            console.log("Role and Password updated.");
        } else {
            // Hash password manually since we are using create/save model hooks might handle it, 
            // but let's rely on the User model's pre-save hook effectively.
            // Actually, simply creating instance and saving triggers pre-save hook.
            const user = new User(admin);
            await user.save();
            console.log(`Created user: ${admin.email}`);
        }
    }

    console.log("Admin Seeding Complete.");
    process.exit();
};

seedAdmins();
