const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function run() {
    try {
        console.log("=== STARTING TECH PLATFORM VERIFICATION ===");
        
        // 1. Log in as the tech accessories seller
        console.log("\n1. Logging in as shashwatdixit11162@gmail.com...");
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'shashwatdixit11162@gmail.com',
            password: 'password123'
        });
        
        const token = loginRes.data.token;
        console.log("Login successful! Token acquired.");

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Fetch trending products
        console.log("\n2. Fetching trending/popular products (should be from Tech and acessories.xlsx)...");
        const trendingRes = await axios.get(`${BASE_URL}/api/catalog/trending?page=1&limit=12`, { headers });
        console.log(`Trending products returned: ${trendingRes.data.length}`);
        if (trendingRes.data.length > 0) {
            console.log("Sample trending product:", {
                name: trendingRes.data[0].name,
                brand: trendingRes.data[0].brand,
                category: trendingRes.data[0].category,
                shopType: trendingRes.data[0].shopType,
                imageUrl: trendingRes.data[0].imageUrl
            });
            // Verify all items belong to tech_accessories
            const hasNonTech = trendingRes.data.some(p => p.shopType !== 'tech_accessories');
            if (hasNonTech) {
                console.error("WARNING: Other shopType products found in trending results!");
            } else {
                console.log("Success: All trending products belong to 'tech_accessories'.");
            }
        } else {
            console.error("WARNING: No trending products returned!");
        }

        // 3. Fetch category "Mobiles, Audio & Wearables"
        console.log("\n3. Fetching products in category 'Mobiles, Audio & Wearables'...");
        const cat1Res = await axios.get(`${BASE_URL}/api/catalog/category/${encodeURIComponent('Mobiles, Audio & Wearables')}?page=1&limit=12`, { headers });
        console.log(`Mobiles, Audio & Wearables products returned: ${cat1Res.data.length}`);
        if (cat1Res.data.length > 0) {
            console.log("Sample Mobiles product:", {
                name: cat1Res.data[0].name,
                brand: cat1Res.data[0].brand,
                category: cat1Res.data[0].category,
                imageUrl: cat1Res.data[0].imageUrl
            });
        } else {
            console.error("WARNING: No products returned for 'Mobiles, Audio & Wearables'!");
        }

        // 4. Fetch category "Computers, Gaming & Office"
        console.log("\n4. Fetching products in category 'Computers, Gaming & Office'...");
        const cat2Res = await axios.get(`${BASE_URL}/api/catalog/category/${encodeURIComponent('Computers, Gaming & Office')}?page=1&limit=12`, { headers });
        console.log(`Computers, Gaming & Office products returned: ${cat2Res.data.length}`);
        if (cat2Res.data.length > 0) {
            console.log("Sample Computers product:", {
                name: cat2Res.data[0].name,
                brand: cat2Res.data[0].brand,
                category: cat2Res.data[0].category,
                imageUrl: cat2Res.data[0].imageUrl
            });
        } else {
            console.error("WARNING: No products returned for 'Computers, Gaming & Office'!");
        }

        // 5. Search for "iPhone"
        console.log("\n5. Searching catalog for 'iPhone'...");
        const searchRes = await axios.get(`${BASE_URL}/api/catalog/search?q=iPhone&page=1&limit=12`, { headers });
        console.log(`Search matches returned: ${searchRes.data.length}`);
        if (searchRes.data.length > 0) {
            console.log("Sample search match:", {
                name: searchRes.data[0].name,
                brand: searchRes.data[0].brand,
                category: searchRes.data[0].category,
                shopType: searchRes.data[0].shopType,
                imageUrl: searchRes.data[0].imageUrl
            });
            const allTech = searchRes.data.every(p => p.shopType === 'tech_accessories');
            if (!allTech) {
                console.error("WARNING: Search returned products from other shop types!");
            } else {
                console.log("Success: All search matches are from 'tech_accessories'.");
            }
        } else {
            console.error("WARNING: No search matches returned for 'iPhone'!");
        }

        // 6. Autocomplete for "HP"
        console.log("\n6. Fetching autocomplete suggestions for 'HP'...");
        const autoRes = await axios.get(`${BASE_URL}/api/catalog/autocomplete?q=HP`, { headers });
        console.log(`Autocomplete suggestions: ${autoRes.data.length}`);
        if (autoRes.data.length > 0) {
            console.log("Sample suggestion:", autoRes.data[0].name);
        } else {
            console.log("No autocomplete suggestions returned for 'HP'.");
        }

        console.log("\n=== TECH PLATFORM VERIFICATION COMPLETE ===");
    } catch (err) {
        console.error("Verification failed with error:", err.response ? err.response.data : err.message);
    }
}

run();
