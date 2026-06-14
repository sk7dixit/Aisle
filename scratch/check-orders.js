const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aisle";

const sellerId = "6a257a0b290120ca802a0e3c";

const orderSchema = new mongoose.Schema({
    sellerId: mongoose.Schema.Types.ObjectId,
    totalAmount: Number,
    status: String,
    createdAt: Date
}, { collection: 'orders' });

const Order = mongoose.model('Order', orderSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log("Today reference:", today.toISOString());

        const allOrders = await Order.find({ sellerId: new mongoose.Types.ObjectId(sellerId) });
        console.log(`Total orders found for seller ${sellerId}: ${allOrders.length}`);
        
        allOrders.forEach(o => {
            console.log(`Order: ID=${o._id}, Amount=${o.totalAmount}, Status=${o.status}, Date=${o.createdAt?.toISOString()}`);
        });

        const activeToday = allOrders.filter(o => {
            const date = new Date(o.createdAt);
            return date >= today && o.status !== 'CANCELLED';
        });

        console.log(`Today active orders count: ${activeToday.length}`);
        const sum = activeToday.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        console.log(`Sum amount today: ${sum}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
