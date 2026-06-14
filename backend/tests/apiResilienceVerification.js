const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { getInventoryProducts } = require('../controllers/inventoryController');

async function testInventoryProductsAPI() {
    const connectDB = require('../config/db');
    await connectDB();

    const mockReq = {
        user: { _id: new mongoose.Types.ObjectId('6a22678de410c49988759fa5') },
        query: { category: 'All' }
    };

    const mockRes = {
        json: (data) => {
            console.log(`✅ Success! Received ${data.length} products from inventory.`);
            mongoose.connection.close();
            process.exit(0);
        },
        status: (code) => {
            return {
                json: (err) => {
                    console.error(`❌ Failed with status ${code}:`, err);
                    mongoose.connection.close();
                    process.exit(1);
                }
            };
        }
    };

    try {
        console.log('Calling getInventoryProducts controller directly...');
        const start = Date.now();
        await getInventoryProducts(mockReq, mockRes);
        console.log(`API execution took ${Date.now() - start}ms.`);
    } catch (err) {
        console.error('Unexpected error:', err.message);
        mongoose.connection.close();
        process.exit(1);
    }
}

testInventoryProductsAPI();
