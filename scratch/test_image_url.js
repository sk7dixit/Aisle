const axios = require('axios');

const test = async () => {
    try {
        const url = 'http://localhost:5000/uploads/shopFront-1780466617602-819841293.jpg';
        console.log(`Requesting image from: ${url}`);
        const res = await axios.head(url);
        console.log('Status:', res.status);
        console.log('Headers:', res.headers);
    } catch (err) {
        console.error('Error fetching image:', err.message);
    }
};

test();
