const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Request = require('../models/Request');
const StockMovement = require('../models/StockMovement');
const { confirmRequest } = require('../controllers/requestController');
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
            countInStock: 10,
            productType: 'STANDARD'
        });

        const request = await Request.create({
            productId: product._id,
            productName: product.name,
            sellerId: seller._id,
            customerId: customer._id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 1000000)
        });

        console.log(`Initial Stock: ${product.countInStock}`);

        // 2. Test Confirmation (Confirming 3 units)
        const req = {
            user: seller,
            body: { requestId: request._id, quantitySold: 3 }
        };
        const res = mockRes();

        await confirmRequest(req, res);

        if (res.statusCode === 400 || res.statusCode === 500) {
            console.error("Fail: Result Error", res.data);
            process.exit(1);
        }

        // 3. Verify Product Stock
        const updatedProduct = await Product.findById(product._id);
        console.log(`Updated Stock: ${updatedProduct.countInStock}`);

        if (updatedProduct.countInStock !== 7) {
            console.error(`FAIL: Expected 7, got ${updatedProduct.countInStock}`);
            process.exit(1);
        }

        // 4. Verify StockMovement
        const movement = await StockMovement.findOne({ requestId: request._id });
        if (!movement || movement.change !== -3) {
            console.error("FAIL: StockMovement record missing or incorrect", movement);
            process.exit(1);
        }

        // 5. Verify Double Confirmation Block
        const res2 = mockRes();
        await confirmRequest(req, res2);
        if (res2.statusCode !== 400) {
            console.error("FAIL: Allowed double confirmation!", res2.data);
            process.exit(1);
        }
        console.log("Success: Double confirmation blocked.");

        console.log("\n✅ ALL PURCHASE CONFIRMATION TESTS PASSED");

        // Cleanup
        await Product.deleteOne({ _id: product._id });
        await Request.deleteOne({ _id: request._id });
        await StockMovement.deleteOne({ _id: movement._id });

        process.exit(0);

    } catch (err) {
        console.error("Test Error:", err);
        process.exit(1);
    }
}

testFlow();
