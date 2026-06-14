const axios = require('axios');

const url = "https://www.indiamart.com/proddetail/flower-fun-big-pichkari-2853045349988.html";

async function run() {
    try {
        console.log(`Scraping Indiamart: ${url}`);
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 5000
        });
        const html = res.data;
        console.log("Indiamart HTML Length:", html.length);

        // Check og:image or twitter:image
        let ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
        if (ogMatch) {
            console.log("Indiamart og:image:", ogMatch[1]);
        } else {
            console.log("No og:image for Indiamart");
        }

        // Search for image URLs in Indiamart page
        const imgUrls = html.match(/https?:\/\/[^"'\s<>]*?\.(jpg|png|jpeg)/gi) || [];
        console.log(`Found ${imgUrls.length} image URLs.`);
        const uniqueUrls = Array.from(new Set(imgUrls));
        console.log("\nFirst 30 image URLs:");
        uniqueUrls.slice(0, 30).forEach((url, i) => console.log(`${i}: ${url}`));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

run();
