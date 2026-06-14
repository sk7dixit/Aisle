const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function run() {
    try {
        console.log("=== STARTING ELECTRICAL PLATFORM VERIFICATION ===");
        
        // 1. Log in as the electrical seller
        console.log("\n1. Logging in as helloworld760975@gmail.com...");
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'helloworld760975@gmail.com',
            password: 'password123'
        });
        
        const token = loginRes.data.token;
        console.log("Login successful! Token acquired.");

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Fetch trending products
        console.log("\n2. Fetching trending/popular products (should be from elctrical.xlsx)...");
        const trendingRes = await axios.get(`${BASE_URL}/api/catalog/trending?page=1&limit=12`, { headers });
        console.log(`Trending products returned: ${trendingRes.data.length}`);
        if (trendingRes.data.length > 0) {
            console.log("Sample trending product:", {
                name: trendingRes.data[0].name,
                brand: trendingRes.data[0].brand,
                category: trendingRes.data[0].category,
                shopType: trendingRes.data[0].shopType
            });
            // Verify no grocery items creep in
            const hasGrocery = trendingRes.data.some(p => p.shopType !== 'electrical_hardware_auto');
            if (hasGrocery) {
                console.error("WARNING: Grocery or other shopType products found in trending results!");
            } else {
                console.log("Success: All trending products belong to 'electrical_hardware_auto'.");
            }
        } else {
            console.error("WARNING: No trending products returned!");
        }

        // 3. Fetch category "Electrical Shop"
        console.log("\n3. Fetching products in category 'Electrical Shop'...");
        const cat1Res = await axios.get(`${BASE_URL}/api/catalog/category/${encodeURIComponent('Electrical Shop')}?page=1&limit=12`, { headers });
        console.log(`Electrical Shop products returned: ${cat1Res.data.length}`);
        if (cat1Res.data.length > 0) {
            console.log("Sample Electrical Shop product:", {
                name: cat1Res.data[0].name,
                brand: cat1Res.data[0].brand,
                category: cat1Res.data[0].category
            });
        } else {
            console.error("WARNING: No products returned for 'Electrical Shop'!");
        }

        // 4. Fetch category "Industrial / Power Tools"
        console.log("\n4. Fetching products in category 'Industrial / Power Tools'...");
        const cat2Res = await axios.get(`${BASE_URL}/api/catalog/category/${encodeURIComponent('Industrial / Power Tools')}?page=1&limit=12`, { headers });
        console.log(`Industrial / Power Tools products returned: ${cat2Res.data.length}`);
        if (cat2Res.data.length > 0) {
            console.log("Sample Industrial / Power Tools product:", {
                name: cat2Res.data[0].name,
                brand: cat2Res.data[0].brand,
                category: cat2Res.data[0].category
            });
        } else {
            console.error("WARNING: No products returned for 'Industrial / Power Tools'!");
        }

        // 5. Search for "Switch"
        console.log("\n5. Searching catalog for 'Switch'...");
        const searchRes = await axios.get(`${BASE_URL}/api/catalog/search?q=Switch&page=1&limit=12`, { headers });
        console.log(`Search matches returned: ${searchRes.data.length}`);
        if (searchRes.data.length > 0) {
            console.log("Sample search match:", {
                name: searchRes.data[0].name,
                brand: searchRes.data[0].brand,
                category: searchRes.data[0].category,
                shopType: searchRes.data[0].shopType
            });
            const allElectrical = searchRes.data.every(p => p.shopType === 'electrical_hardware_auto');
            if (!allElectrical) {
                console.error("WARNING: Search returned products from other shop types!");
            } else {
                console.log("Success: All search matches are from 'electrical_hardware_auto'.");
            }
        } else {
            console.error("WARNING: No search matches returned for 'Switch'!");
        }

        // 6. Autocomplete for "Anchor"
        console.log("\n6. Fetching autocomplete suggestions for 'Anchor'...");
        const autoRes = await axios.get(`${BASE_URL}/api/catalog/autocomplete?q=Anchor`, { headers });
        console.log(`Autocomplete suggestions: ${autoRes.data.length}`);
        if (autoRes.data.length > 0) {
            console.log("Sample suggestion:", autoRes.data[0].name);
        } else {
            console.log("No autocomplete suggestions returned for 'Anchor'.");
        }

        console.log("\n=== ELECTRICAL PLATFORM VERIFICATION COMPLETE ===");
    } catch (err) {
        console.error("Verification failed with error:", err.response ? err.response.data : err.message);
    }
}

run();
