const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
const MasterCatalogProduct = require('../backend/models/MasterCatalogProduct');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const products = await MasterCatalogProduct.find({ shopType: 'tech_accessories' }).lean();
        
        let placeholderCount = 0;
        let emptyCount = 0;
        let driveCount = 0;
        let healedCount = 0;
        
        const categories = {};
        
        products.forEach(p => {
            const url = p.imageUrl || '';
            if (!categories[p.category]) categories[p.category] = { total: 0, placeholders: [], drive: [], healed: [], empty: [] };
            categories[p.category].total++;
            
            if (!url) {
                emptyCount++;
                categories[p.category].empty.push(p.name);
            } else if (url.includes('placeholder')) {
                placeholderCount++;
                categories[p.category].placeholders.push(p.name);
            } else if (url.includes('googleusercontent.com') || url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com')) {
                driveCount++;
                categories[p.category].drive.push(p.name);
            } else {
                healedCount++;
                categories[p.category].healed.push(p.name);
            }
        });
        
        console.log('=== Tech Accessories Images Summary ===');
        console.log('Total Products:', products.length);
        console.log('Direct Google Drive Links:', driveCount);
        console.log('Healed Links (Unsplash/etc):', healedCount);
        console.log('Placeholder Links:', placeholderCount);
        console.log('Empty Links:', emptyCount);
        
        console.log('\nBreakdown by Category:');
        Object.entries(categories).forEach(([cat, stats]) => {
            console.log(`- ${cat}: Total: ${stats.total}, Placeholders: ${stats.placeholders.length}, Drive: ${stats.drive.length}, Healed: ${stats.healed.length}, Empty: ${stats.empty.length}`);
            if (stats.placeholders.length > 0) {
                console.log(`  Sample placeholders:`, stats.placeholders.slice(0, 5));
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
