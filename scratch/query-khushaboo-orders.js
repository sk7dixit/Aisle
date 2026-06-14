const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aisle";

// Let's load the Order and CustomerVisit models
// Wait, we need to know where the Order/Visit schemas are. Let's find them.
const User = require('../backend/models/User');

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully.");

        // Let's find the models dynamically by checking mongoose models or schemas
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        // Let's query customervisits and orders collections directly
        const db = mongoose.connection.db;
        const visitsCol = db.collection('customervisits');
        const ordersCol = db.collection('orders');

        const khushabooId = new mongoose.Types.ObjectId("6a257a0b290120ca802a0e3c");

        const visits = await visitsCol.find({ seller: khushabooId }).toArray();
        console.log(`\n--- Khushaboo Visits (${visits.length}) ---`);
        visits.forEach(v => {
            console.log("Visit:", JSON.stringify(v, null, 2));
        });

        const orders = await ordersCol.find({ seller: khushabooId }).toArray();
        console.log(`\n--- Khushaboo Orders (${orders.length}) ---`);
        orders.forEach(o => {
            console.log("Order:", JSON.stringify(o, null, 2));
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error running script:", err);
    }
}

run();
