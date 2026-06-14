const axios = require('axios');

const urls = [
    { name: "Flipkart", url: "https://www.flipkart.com/centaur-fully-automatic-foldable-sun-uv-protection-cover-umbrella/p/itm9e81c2242deec" },
    { name: "Decathlon", url: "https://www.decathlon.in/p/8585162/men-full-zip-waterproof-rain-jacket-and-windcheater-blue-black-mh150" },
    { name: "Westside", url: "https://www.westside.com/blogs/women-fashion/monsoon-must-haves" },
    { name: "Ajio", url: "https://www.ajio.com/the-souled-store-men-oversized-fit-knitted-pullover-sweater/p/701770626_grey" }
];

async function testUrl(item) {
    try {
        console.log(`\n--------------------\nTesting ${item.name}: ${item.url}`);
        const res = await axios.get(item.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 5000
        });
        console.log(`Status: ${res.status}`);
        const html = res.data;
        console.log(`Length: ${html.length}`);
        
        if (html.includes('captcha') || html.includes('bot') || html.includes('shield') || html.includes('security') && html.length < 5000) {
            console.log("Likely blocked / Captcha!");
        } else {
            let ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                          html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
            if (ogMatch) {
                console.log("Found og:image:", ogMatch[1]);
            } else {
                console.log("No og:image found. First 200 chars:", html.substring(0, 200).replace(/\s+/g, ' '));
            }
        }
    } catch (e) {
        console.log(`Failed with error: ${e.message}`);
    }
}

async function run() {
    for (const item of urls) {
        await testUrl(item);
    }
}

run();
