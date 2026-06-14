require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const { searchProductImage } = require('../backend/services/googleImageService');

async function test() {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully!");

    const queries = [
        "Chain Pulley Block",
        "Bench Vice",
        "Shackle",
        "Wire Rope"
    ];
    
    console.log("Testing searchProductImage via Google Custom Search...");
    for (const q of queries) {
        const img = await searchProductImage(q);
        console.log(`Query: "${q}" -> Image: "${img}"`);
    }

    await mongoose.disconnect();
    console.log("Database disconnected.");
}

test();
