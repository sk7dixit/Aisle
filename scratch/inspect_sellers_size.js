const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../backend/models/User');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const sellers = await User.find({ role: 'seller' }).lean();
        
        console.log(`Found ${sellers.length} sellers.`);
        for (const s of sellers) {
            const str = JSON.stringify(s);
            console.log(`Seller ID: ${s._id}`);
            console.log(`- Total JSON Size: ${str.length} chars`);
            console.log(`- shopName: ${s.shopDetails?.shopName}`);
            
            // Check sizes of top-level keys
            for (const [key, val] of Object.entries(s)) {
                const valStr = JSON.stringify(val);
                if (valStr && valStr.length > 1000) {
                    console.log(`  * Key "${key}" is heavy: ${valStr.length} chars`);
                    if (typeof val === 'object' && val !== null) {
                        for (const [subKey, subVal] of Object.entries(val)) {
                            const subValStr = JSON.stringify(subVal);
                            if (subValStr.length > 1000) {
                                console.log(`    - Subkey "${subKey}" is heavy: ${subValStr.length} chars`);
                            }
                        }
                    }
                }
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
