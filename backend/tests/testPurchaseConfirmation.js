const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Request = require('../models/Request');
const Visit = require('../models/Visit');
const Reservation = require('../models/Reservation');
const { acceptRequest } = require('../controllers/requestController');
const { completeVisit } = require('../controllers/visitController');
const User = require('../models/User');
const connectDB = require('../config/db');

// Mock req/res
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};

async function testFlow() {
    try {
        await connectDB();
        console.log("Connected to DB via config");

        // 1. Setup Test Data
        const seller = await User.findOne({ role: 'seller' });
        const customer = await User.findOne({ role: 'customer' });

        if (!seller || !customer) {
            console.error("Please ensure you have at least one seller and one customer in the DB.");
            process.exit(1);
        }

        const product = await Product.create({
            seller: seller._id,
            name: "Test Trust Product",
            category: "General",
            subCategory: "General",
            categorySlug: "general",
            shopType: "GROCERY_KIRANA",
            countInStock: 10,
            productType: 'STANDARD'
        });

        const request = await Request.create({
            productId: product._id,
            productName: product.name,
            sellerId: seller._id,
            customerId: customer._id,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 1000000)
        });

        console.log(`Initial Stock: ${product.countInStock}`);

        // 2. Test Accept Request (Seller accepts)
        const reqAccept = {
            user: seller,
            params: { id: request._id },
            body: {}
        };
        const resAccept = mockRes();

        await acceptRequest(reqAccept, resAccept);

        if (resAccept.statusCode === 400 || resAccept.statusCode === 500) {
            console.error("Fail: Accept Request Error", resAccept.data);
            process.exit(1);
        }

        // 3. Verify Visit and Reservation were created
        const visit = await Visit.findOne({ interestRequestId: request._id });
        if (!visit) {
            console.error("FAIL: Visit not created.");
            process.exit(1);
        }

        const reservation = await Reservation.findOne({ requestId: request._id, status: 'ACTIVE' });
        if (!reservation) {
            console.error("FAIL: Reservation not created.");
            process.exit(1);
        }

        console.log("Accept Request succeeded. Reservation is ACTIVE.");

        // 4. Simulate Customer Arrival (QR Scan)
        visit.status = 'ARRIVED';
        await visit.save();
        console.log("Simulated customer arrival (visit ARRIVED).");

        // 5. Complete Visit (Seller finalizes transaction)
        const reqComplete = {
            user: seller,
            params: { id: visit._id },
            body: {}
        };
        const resComplete = mockRes();

        await completeVisit(reqComplete, resComplete);

        if (resComplete.statusCode === 400 || resComplete.statusCode === 500) {
            console.error("Fail: Complete Visit Error", resComplete.data);
            process.exit(1);
        }

        // 6. Verify Product Stock Deducted
        const updatedProduct = await Product.findById(product._id);
        console.log(`Updated Stock: ${updatedProduct.countInStock}`);

        if (updatedProduct.countInStock !== 9) {
            console.error(`FAIL: Expected 9, got ${updatedProduct.countInStock}`);
            process.exit(1);
        }

        // 7. Verify Double Confirmation Block (Should fail since request is no longer PENDING)
        const resAccept2 = mockRes();
        await acceptRequest(reqAccept, resAccept2);
        if (resAccept2.statusCode !== 400) {
            console.error("FAIL: Allowed double accept!", resAccept2.data);
            process.exit(1);
        }
        console.log("Success: Double accept blocked.");

        console.log("\n✅ ALL PURCHASE CONFIRMATION TESTS PASSED");

        // Cleanup
        await Product.deleteOne({ _id: product._id });
        await Request.deleteOne({ _id: request._id });
        await Visit.deleteOne({ _id: visit._id });
        await Reservation.deleteOne({ _id: reservation._id });

        process.exit(0);

    } catch (err) {
        console.error("Test Error:", err);
        process.exit(1);
    }
}

testFlow();
