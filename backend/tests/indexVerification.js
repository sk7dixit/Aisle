const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const Product = require('../models/Product');

async function verifyIndex() {
    const connectDB = require('../config/db');
    await connectDB();

    try {
        console.log('Running explain on Product inventory sort query...');
        
        // Simulating the query executed by getInventoryProducts
        const explanation = await Product.find({
            seller: new mongoose.Types.ObjectId('6a22678de410c49988759fa5')
        }).sort({ createdAt: -1 }).explain('executionStats');

        const winningPlan = explanation.queryPlanner?.winningPlan;
        const stage = winningPlan?.inputStage?.stage || winningPlan?.stage;
        
        console.log('Winning Plan:', JSON.stringify(winningPlan, null, 2));
        
        // Check if there is a SORT stage in the queryPlanner tree
        let hasInMemorySort = winningPlan.stage === 'SORT' || winningPlan.inputStage?.stage === 'SORT';
        if (winningPlan.inputStage?.inputStage?.stage === 'SORT') {
            hasInMemorySort = true;
        }
        
        if (hasInMemorySort) {
            console.error('❌ Index Verification Failed: MongoDB is still performing an in-memory SORT stage!');
        } else {
            console.log('✅ Index Verification Passed: MongoDB is using the index to retrieve documents in sorted order without in-memory sorting.');
        }
    } catch (err) {
        console.error('Index Verification Error:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

verifyIndex();
