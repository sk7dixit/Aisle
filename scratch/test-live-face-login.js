const axios = require('axios');

async function run() {
    try {
        console.log("Sending POST to http://localhost:5174/api/auth/login-face ...");
        const res = await axios.post('http://localhost:5174/api/auth/login-face', {
            identifier: 'shashwatd.dixit33@gmail.com',
            faceData: 'data:image/jpeg;base64,mockfacedata'
        });
        console.log("Success:", res.status, res.data);
    } catch (err) {
        console.log("Error status:", err.response ? err.response.status : 'No response');
        console.log("Error data:", err.response ? err.response.data : err.message);
    }
}

run();
