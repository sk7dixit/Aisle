
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });
const User = require("./models/User");

async function wipeSellers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        const result = await User.deleteMany({ role: "seller" });
        console.log(`🗑️ Deleted ${result.deletedCount} seller accounts.`);

        console.log("🎉 Seller wipe complete");
    } catch (error) {
        console.error("❌ Error wiping sellers:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

wipeSellers();
