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
        
        console.log("Searching for landingImage or other image attributes...");
        
        // Find tags with id="landingImage" or similar
        const landingImgMatch = html.match(/<img[^>]+id=["']landingImage["'][^>]*>/i);
        if (landingImgMatch) {
            console.log("Found landingImage tag:", landingImgMatch[0]);
        } else {
            console.log("No landingImage tag found.");
        }

        // Find data-a-dynamic-image
        const dynImgMatch = html.match(/data-a-dynamic-image=["']([^"']+)["']/i);
        if (dynImgMatch) {
            console.log("Found data-a-dynamic-image attribute value:", dynImgMatch[1].substring(0, 300));
        }

        // Search for JSON colorImages block
        const colorImagesMatch = html.match(/'colorImages':\s*({[^}]+})/i) || html.match(/"colorImages":\s*({[^}]+})/i) || html.match(/colorImages\s*=\s*({[^;]+})/i);
        if (colorImagesMatch) {
            console.log("Found colorImages script block:", colorImagesMatch[1].substring(0, 300));
        }

        // Look for any image tags with class or id containing main/primary/landing
        const imgTags = html.match(/<img[^>]+>/gi) || [];
        console.log(`Total image tags: ${imgTags.length}`);
        const interestingImgs = imgTags.filter(img => img.includes('landing') || img.includes('main') || img.includes('prodImage') || img.includes('primary'));
        console.log("Interesting image tags:");
        interestingImgs.slice(0, 10).forEach(img => console.log(img));
        
    } catch (err) {
        console.error(err);
    }
}

run();
