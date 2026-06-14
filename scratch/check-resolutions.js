const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aisle";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully");

        const customerId = new mongoose.Types.ObjectId("6a203d5c5aac6b48b91dbf5c");

        const orders = await mongoose.connection.db.collection('orders').find({ customerId }).toArray();
        console.log("Seeded Orders count for Shashwat Dixit:", orders.length);
        orders.forEach(o => {
            console.log(`- Order ID: ${o._id}, Status: ${o.status}, paymentStatus: ${o.paymentStatus}, totalAmount: ${o.totalAmount}, CreatedAt: ${o.createdAt}`);
        });

        const visits = await mongoose.connection.db.collection('customervisits').find({ customerId }).toArray();
        console.log("Seeded Visits count for Shashwat Dixit:", visits.length);
        visits.forEach(v => {
            console.log(`- Visit ID: ${v._id}, visitStatus: ${v.visitStatus}, paymentStatus: ${v.paymentStatus}, CreatedAt: ${v.createdAt}`);
        });

        const supportRequests = await mongoose.connection.db.collection('supportrequests').find({ user: customerId }).toArray();
        console.log("Seeded Support Requests count for Shashwat Dixit:", supportRequests.length);
        supportRequests.forEach(s => {
            console.log(`- Ticket ID: ${s._id}, Category: ${s.category}, Priority: ${s.priority}, Summary: ${s.summary}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
