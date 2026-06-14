const axios = require('axios');

const urls = [
    { name: "SakthiCrackers", url: "https://sakthicrackers.com/product/7-cm-red-sparklers/" },
    { name: "SivakasiFireworks", url: "https://www.sivakasifireworks.net/product/bijili-crackers-red-50/" },
    { name: "WoollenWear", url: "https://woollen-wear.in/acrylic-monkey-cap-darkbrown" },
    { name: "Homafy", url: "https://homafy.com/product/crystal-tealight-led-diyas/" }
];

async function inspect(item) {
    try {
        console.log(`\n================ INSPECTING ${item.name} ================\n`);
        const res = await axios.get(item.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });
        const html = res.data;
        console.log(`HTML Length: ${html.length}`);
        
        // Find all img tags or links ending with jpg/png/jpeg/webp
        const imgTags = html.match(/<img[^>]+>/gi) || [];
        console.log(`Found ${imgTags.length} img tags.`);
        
        console.log("First 15 img tags:");
        imgTags.slice(0, 15).forEach((tag, idx) => {
            console.log(`${idx}: ${tag}`);
        });

        // Search for uploads or product images
        const wpUploads = html.match(/https?:\/\/[^"'\s<>]*?wp-content\/uploads\/[^"'\s<>]*?\.(jpg|png|jpeg|webp)/gi) || [];
        const shopifyImages = html.match(/https?:\/\/cdn\.shopify\.com\/[^"'\s<>]*?\.(jpg|png|jpeg|webp)/gi) || [];
        const genericImages = html.match(/https?:\/\/[^"'\s<>]*?\/product[s]?\/[^"'\s<>]*?\.(jpg|png|jpeg|webp)/gi) || [];

        console.log(`wp-content/uploads/ matches: ${wpUploads.length}`);
        if (wpUploads.length > 0) {
            console.log("Unique wp uploads (first 5):", Array.from(new Set(wpUploads)).slice(0, 5));
        }

        console.log(`shopify CDN matches: ${shopifyImages.length}`);
        if (shopifyImages.length > 0) {
            console.log("Unique shopify images (first 5):", Array.from(new Set(shopifyImages)).slice(0, 5));
        }

        console.log(`generic product images matches: ${genericImages.length}`);
        if (genericImages.length > 0) {
            console.log("Unique product images (first 5):", Array.from(new Set(genericImages)).slice(0, 5));
        }

    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}

async function run() {
    for (const item of urls) {
        await inspect(item);
    }
}

run();
