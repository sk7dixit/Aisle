const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const User = require("./models/User");
const Product = require("./models/Product");
const Request = require("./models/Request");
const Visit = require("./models/Visit");
const Interest = require("./models/Interest");
const Reservation = require("./models/Reservation");
const Otp = require("./models/Otp");
const Lead = require("./models/Lead");
const Notification = require("./models/Notification");

async function cleanSystem() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        // 1. Users (Sellers & Customers) - Keeping Admins for safety if needed, or just wipe non-admins
        const userResult = await User.deleteMany({ role: { $in: ['customer', 'seller'] } });
        console.log(`🗑️ Deleted ${userResult.deletedCount} Customers/Sellers.`);

        // 2. Products
        const prodResult = await Product.deleteMany({});
        console.log(`🗑️ Deleted ${prodResult.deletedCount} Products.`);

        // 3. Requests
        const reqResult = await Request.deleteMany({});
        console.log(`🗑️ Deleted ${reqResult.deletedCount} Requests.`);

        // 4. Visits
        const visitResult = await Visit.deleteMany({});
        console.log(`🗑️ Deleted ${visitResult.deletedCount} Visits.`);

        // 5. Interests
        const intResult = await Interest.deleteMany({});
        console.log(`🗑️ Deleted ${intResult.deletedCount} Interests.`);

        // 6. Reservations
        const resResult = await Reservation.deleteMany({});
        console.log(`🗑️ Deleted ${resResult.deletedCount} Reservations.`);

        // 7. OTPs
        const otpResult = await Otp.deleteMany({});
        console.log(`🗑️ Deleted ${otpResult.deletedCount} OTPs.`);

        // 8. Leads
        const leadResult = await Lead.deleteMany({});
        console.log(`🗑️ Deleted ${leadResult.deletedCount} Leads.`);

        // 9. Notifications
        const notResult = await Notification.deleteMany({});
        console.log(`🗑️ Deleted ${notResult.deletedCount} Notifications.`);

        console.log("🎉 System Clean Complete. Ready for Fresh Test.");
    } catch (error) {
        console.error("❌ Error cleaning system:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

cleanSystem();
