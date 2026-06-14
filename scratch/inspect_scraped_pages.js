const axios = require('axios');

const urls = [
    { name: "Flipkart", url: "https://www.flipkart.com/centaur-fully-automatic-foldable-sun-uv-protection-cover-umbrella/p/itm9e81c2242deec" },
    { name: "Decathlon", url: "https://www.decathlon.in/p/8585162/men-full-zip-waterproof-rain-jacket-and-windcheater-blue-black-mh150" },
    { name: "Westside", url: "https://www.westside.com/blogs/women-fashion/monsoon-must-haves" }
];

async function testUrl(item) {
    try {
        console.log(`\n====================\nAnalyzing ${item.name}`);
        const res = await axios.get(item.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            },
            timeout: 8000
        });
        const html = res.data;
        console.log(`Length: ${html.length}`);
        
        // Find og:image or twitter:image
        let ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
        if (ogMatch) {
            console.log("Found og:image:", ogMatch[1]);
        } else {
            console.log("No og:image/twitter:image found in meta tags.");
        }

        // Search for image URLs in the page that look like product images
        let imgPattern;
        if (item.name === "Flipkart") {
            // Flipkart images are usually on rukminim2.flixcart.com/image/
            imgPattern = /https?:\/\/rukminim2\.flixcart\.com\/image\/[a-zA-Z0-9_\-\.\/]+/gi;
        } else if (item.name === "Decathlon") {
            // Decathlon images are usually on contents.mediadecathlon.com/p...
            imgPattern = /https?:\/\/contents\.mediadecathlon\.com\/p[a-zA-Z0-9_\-\.\/]+/gi;
        } else if (item.name === "Westside") {
            imgPattern = /https?:\/\/[a-z0-9\.\-]*westside\.com\/[a-zA-Z0-9_\-\.\/]+/gi;
        }

        if (imgPattern) {
            const matches = html.match(imgPattern) || [];
            console.log(`Found ${matches.length} matching image patterns.`);
            const uniqueMatches = Array.from(new Set(matches));
            console.log("Unique matches (up to 10):");
            uniqueMatches.slice(0, 10).forEach(u => console.log(`  - ${u}`));
        }

    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

async function run() {
    for (const item of urls) {
        await testUrl(item);
    }
}

run();
