require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const MasterCatalogProduct = require('../backend/models/MasterCatalogProduct');
const { searchProductImage } = require('../backend/services/googleImageService');

async function run() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected successfully!");

        // Find all electrical products using the placeholder image
        const products = await MasterCatalogProduct.find({
            shopType: 'electrical_hardware_auto',
            imageUrl: { $regex: 'photo-1581092160607-ee22621dd758' }
        });

        console.log(`Found ${products.length} products to heal.`);

        let healedCount = 0;
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const query = `${product.brand !== 'General' ? product.brand : ''} ${product.name}`.trim();
            console.log(`[${i + 1}/${products.length}] Healing "${product.name}"...`);
            
            try {
                // Call searchProductImage
                const googleImg = await searchProductImage(query, { category: product.category, brand: product.brand });
                if (googleImg && !googleImg.includes('photo-1581092160607-ee22621dd758') && !googleImg.includes('placeholder')) {
                    product.imageUrl = googleImg;
                    await product.save();
                    console.log(`   -> Success: "${googleImg}"`);
                    healedCount++;
                } else {
                    console.log(`   -> No direct match or returned placeholder.`);
                }
            } catch (err) {
                console.error(`   -> Failed to heal "${product.name}":`, err.message);
            }
            
            // Add a small delay between requests to be gentle to API limits
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`\nHealing complete. Successfully updated ${healedCount} of ${products.length} product images.`);
    } catch (error) {
        console.error("Critical error in preheat script:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Database disconnected.");
    }
}

run();
