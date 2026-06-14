const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const { seedMockHistoricalData, generateForecasts } = require("../services/forecastService");

const run = async () => {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        // 1. Setup seller
        const email = "seller@aisle.com";
        const user = await User.findOne({ email });
        if (user) {
            user.password = "password123";
            user.shopDetails = user.shopDetails || {};
            user.shopDetails.city = "indore";
            user.shopDetails.location = user.shopDetails.location || {};
            user.shopDetails.location.city = "indore";
            user.shopDetails.shopLocation = user.shopDetails.shopLocation || {};
            user.shopDetails.shopLocation.city = "indore";
            await user.save();
            console.log(`Successfully updated ${email} password to 'password123' and city to 'indore'.`);
        } else {
            console.log(`Demo seller ${email} not found.`);
        }

        // 2. Clear old forecast history and seed fresh Indore mock history + forecasts
        const DemandHistory = require("../models/DemandHistory");
        const DemandForecast = require("../models/DemandForecast");
        await DemandHistory.deleteMany({ city: "indore" });
        await DemandForecast.deleteMany({ city: "indore" });

        console.log("Running forecasting seeding and generation...");
        await seedMockHistoricalData();
        await generateForecasts();
        console.log("Forecasting setup completed!");

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
