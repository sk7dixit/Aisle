const axios = require('axios');

const amazonUrl = "https://www.amazon.in/BRIGHT-BLOOM-Red-Skin-Friendly-Celebration/dp/B0CS9KFXH1";
const bbUrl = "https://www.bigbasket.com/pd/40295611/house-of-festivals-glitter-organic-herbal-holi-colourgulal-yellow-no-harmful-chemicals-100-g/";

async function testScrape(url, label) {
    try {
        console.log(`\nTesting ${label}: ${url}`);
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 5000
        });
        console.log(`Status: ${res.status}`);
        const html = res.data;
        console.log(`HTML Length: ${html.length}`);
        
        // Check if blocked by captcha
        if (html.includes('captcha') || html.includes('Robot') || html.includes('robot')) {
            console.log("Blocked by CAPTCHA / Bot detection!");
        } else {
            console.log("Not blocked! Scanning for images...");
            let ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                          html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
            if (ogMatch) {
                console.log("Found og:image:", ogMatch[1]);
            } else {
                console.log("No og:image found. First 500 chars of HTML:");
                console.log(html.substring(0, 500));
            }
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
    }
}

async function run() {
    await testScrape(amazonUrl, "Amazon");
    await testScrape(bbUrl, "BigBasket");
}

run();
