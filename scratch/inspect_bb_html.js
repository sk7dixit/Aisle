const axios = require('axios');
const fs = require('fs');

const bbUrl = "https://www.bigbasket.com/pd/40295611/house-of-festivals-glitter-organic-herbal-holi-colourgulal-yellow-no-harmful-chemicals-100-g/";

async function run() {
    try {
        const res = await axios.get(bbUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });
        const html = res.data;
        
        console.log("Searching for image patterns in BigBasket HTML...");
        
        // Let's find all occurrences of http/https urls ending with jpg/png/jpeg
        const imgUrls = html.match(/https?:\/\/[^"'\s<>]*?\.(jpg|png|jpeg|webp)/gi) || [];
        console.log(`Found ${imgUrls.length} image URLs in the page.`);
        
        // Print unique image URLs
        const uniqueUrls = Array.from(new Set(imgUrls));
        console.log("\nFirst 30 image URLs found:");
        uniqueUrls.slice(0, 30).forEach((url, i) => {
            console.log(`${i}: ${url}`);
        });
        
    } catch (err) {
        console.error(err);
    }
}

run();
