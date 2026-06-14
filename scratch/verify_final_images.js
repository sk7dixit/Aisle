const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const connectDB = require('../backend/config/db');
const MasterCatalogProduct = require('../backend/models/MasterCatalogProduct');

async function verify() {
    try {
        await connectDB();
        
        const products = await MasterCatalogProduct.find({ shopType: 'seasonal_festive' });
        console.log(`Total Seasonal & Festive Products in DB: ${products.length}`);
        
        // Count fallbacks
        const genericFallbackCount = products.filter(p => p.imageUrl && p.imageUrl.includes('photo-1542838132-92c53300491e')).length;
        const otherUnsplashCount = products.filter(p => p.imageUrl && p.imageUrl.includes('unsplash.com') && !p.imageUrl.includes('photo-1542838132-92c53300491e')).length;
        const directScrapeCount = products.length - genericFallbackCount - otherUnsplashCount;
        
        console.log(`\nImage Source Statistics:`);
        console.log(`- Direct Scraped / High-quality Google Image Search: ${directScrapeCount} products`);
        console.log(`- Unsplash API Search Fallbacks: ${otherUnsplashCount} products`);
        console.log(`- Ultimate Generic Fallback: ${genericFallbackCount} products`);
        
        console.log(`\nKey Products Check:`);
        const keys = [
            'Holi Gulal Red', 'Holi Gulal Green', 'Holi Gulal Yellow', 'Pichkari Small', 'Pichkari Large',
            'Ganpati Idol Large', 'Eco Friendly Ganpati', 'Rangoli Colours', 'Decorative Diyas', 'Christmas Tree Large',
            'Chakri Deluxe', 'Sparklers Small', 'Raincoat Men', 'Sweater Men', 'Puffer Jacket', 'Bomber Jacket', 'Heating Pad'
        ];
        
        for (const k of keys) {
            const prod = products.find(p => p.name.toLowerCase() === k.toLowerCase());
            if (prod) {
                console.log(`- "${prod.name}": "${prod.imageUrl}"`);
            } else {
                console.log(`- "${k}": NOT FOUND`);
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
