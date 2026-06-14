const axios = require('axios');
const fs = require('fs');

const amazonUrl = "https://www.amazon.in/BRIGHT-BLOOM-Red-Skin-Friendly-Celebration/dp/B0CS9KFXH1";

async function run() {
    try {
        const res = await axios.get(amazonUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        const html = res.data;
        console.log("Amazon HTML Length:", html.length);
        
        // Let's search for image tags and URLs
        const imgUrls = html.match(/https?:\/\/[^"'\s<>]*?media-amazon\.com\/images\/I\/[^"'\s<>]*?\.(jpg|png|jpeg)/gi) || [];
        console.log(`Found ${imgUrls.length} Amazon image URLs.`);
        
        const uniqueUrls = Array.from(new Set(imgUrls));
        console.log("\nFirst 30 Amazon image URLs found:");
        uniqueUrls.slice(0, 30).forEach((url, i) => {
            console.log(`${i}: ${url}`);
        });
        
    } catch (err) {
        console.error(err);
    }
}

run();
