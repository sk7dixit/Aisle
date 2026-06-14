const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aisle";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully.");

        const db = mongoose.connection.db;
        const visitsCol = db.collection('customervisits');

        // Query all visits in the collection
        const allVisits = await visitsCol.find({}).toArray();
        console.log(`Total visits in collection: ${allVisits.length}`);

        allVisits.forEach(v => {
            console.log(`Visit ID: ${v._id}`);
            console.log(`  sellerId: ${v.sellerId}`);
            console.log(`  customerId: ${v.customerId}`);
            console.log(`  visitStatus: ${v.visitStatus}`);
            console.log(`  products: ${JSON.stringify(v.products)}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
