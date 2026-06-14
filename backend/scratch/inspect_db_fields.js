const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        const conn = mongoose.connection;
        const product = await conn.db.collection('products').findOne({});
        console.log("RAW PRODUCT FROM DB:");
        console.log(JSON.stringify(product, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
run();
