const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aisle";

const customerId = new mongoose.Types.ObjectId("6a203d5c5aac6b48b91dbf5c");
const grocerySellerId = new mongoose.Types.ObjectId("6a22678de410c49988759fa5");
const pharmacySellerId = new mongoose.Types.ObjectId("6a257a0b290120ca802a0e3c");

const tataSaltId = new mongoose.Types.ObjectId("6a265ea64ff762e97a744c26");
const maggiNoodlesId = new mongoose.Types.ObjectId("6a265ea64ff762e97a744c2f");
const mustardOilId = new mongoose.Types.ObjectId("6a265ea64ff762e97a744c29");

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully");

        const db = mongoose.connection.db;

        // Clear existing orders, customervisits, supportrequests for this customer to have a clean test state
        await db.collection('orders').deleteMany({ customerId });
        await db.collection('customervisits').deleteMany({ customerId });
        await db.collection('supportrequests').deleteMany({ user: customerId });

        console.log("Cleaned up existing orders, visits, and support requests for customer.");

        // 1. Seed Order 1: Confirmed Prepaid Order
        const order1 = {
            customerId,
            sellerId: grocerySellerId,
            items: [
                {
                    product: tataSaltId,
                    name: "Tata Salt",
                    quantity: 2,
                    price: 25,
                    image: "https://images.unsplash.com/photo-1518085023892-ed6b1a13e1f6?w=400"
                },
                {
                    product: maggiNoodlesId,
                    name: "Maggi 2-Minute Noodles",
                    quantity: 1,
                    price: 160,
                    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400"
                }
            ],
            totalAmount: 210,
            status: "CONFIRMED",
            paymentMode: "PREPAID",
            paymentStatus: "PAID",
            qrCode: "QR-ORDER-CONFIRMED-001",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 2. Seed Order 2: Delayed Order (Pending, created 20 minutes ago)
        const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
        const order2 = {
            customerId,
            sellerId: grocerySellerId,
            items: [
                {
                    product: mustardOilId,
                    name: "Fortune Mustard Oil",
                    quantity: 1,
                    price: 175,
                    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400"
                }
            ],
            totalAmount: 175,
            status: "PENDING",
            paymentMode: "PREPAID",
            paymentStatus: "PAID",
            qrCode: "QR-ORDER-DELAYED-002",
            createdAt: twentyMinsAgo,
            updatedAt: twentyMinsAgo
        };

        // 3. Seed Visit 1: Upcoming Visit (Visit Order)
        const visit1 = {
            customerId,
            sellerId: pharmacySellerId,
            products: [
                {
                    productId: new mongoose.Types.ObjectId("6a269418e56462f7c0e84e58"), // Dolo 650
                    name: "Dolo 650 (650mg)",
                    quantity: 2,
                    priceAtTime: 30,
                    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400"
                }
            ],
            paymentMode: "PAY_ON_VISIT",
            paymentStatus: "PENDING",
            visitStatus: "UPCOMING",
            visitTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
            qrToken: "VISIT-TOKEN-UPCOMING-001",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Insert documents
        const resOrder1 = await db.collection('orders').insertOne(order1);
        const resOrder2 = await db.collection('orders').insertOne(order2);
        const resVisit1 = await db.collection('customervisits').insertOne(visit1);

        console.log("Seeded Order 1 ID:", resOrder1.insertedId);
        console.log("Seeded Order 2 (Delayed) ID:", resOrder2.insertedId);
        console.log("Seeded Visit 1 ID:", resVisit1.insertedId);

        // 4. Seed Support Request (Dispute) for the Confirmed Order
        const ticket1 = {
            user: customerId,
            identifier: "8542929942",
            category: "Shopping",
            summary: `Dispute raised for Order #${resOrder1.insertedId.toString().slice(-6)}. Issue: Extra charged for Salt.`,
            status: "open",
            priority: "high",
            logs: [
                {
                    sender: "user",
                    text: "I was charged more than the price on the packet.",
                    timestamp: new Date()
                }
            ],
            meta: {
                orderId: resOrder1.insertedId,
                orderType: "regular",
                sellerName: "XYZ seller "
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const resTicket1 = await db.collection('supportrequests').insertOne(ticket1);
        console.log("Seeded Support Ticket ID:", resTicket1.insertedId);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
