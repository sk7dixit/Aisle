const axios = require('axios');

async function test() {
    const urls = [
        "https://drive.google.com/file/d/1LfvCNtuDpMc9wWqoTf3Id6Jb0fmlsRrf/view?usp=drive_link",
        "https://share.google/OKZBOmaAaFswZicDr"
    ];
    
    for (const url of urls) {
        console.log(`\nTesting URL: ${url}`);
        try {
            const res = await axios.head(url, { maxRedirects: 5, validateStatus: () => true });
            console.log("Status:", res.status);
            console.log("Headers:", JSON.stringify(res.headers, null, 2));
            
            // Also try to get body/redirect url
            const getRes = await axios.get(url, { maxRedirects: 0, validateStatus: () => true });
            console.log("GET Status:", getRes.status);
            console.log("Location header:", getRes.headers.location);
        } catch (e) {
            console.error("Error:", e.message);
        }
    }
}

test();
