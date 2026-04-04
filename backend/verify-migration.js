
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });
const User = require("./models/User");

async function verify() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // specific search for likely electronics seller or just any seller
    const sellers = await User.find({ role: 'seller' }).limit(5);

    sellers.forEach(s => {
        console.log(`\nEmail: ${s.email}`);
        console.log(`Category: ${s.shopDetails?.category}`);
        console.log(`ShopCategory: ${s.shopDetails?.shopCategory}`);
        console.log(`CustomInput: ${s.shopDetails?.customCategoryInput}`);
        console.log(`ResolvedKey: ${s.shopDetails?.resolvedCategoryKey}`);
        console.log(`AllowedSubs: ${JSON.stringify(s.shopDetails?.allowedSubCategories)}`);
    });

    mongoose.disconnect();
}

verify();
