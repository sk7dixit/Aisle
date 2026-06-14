const axios = require('axios');
const dotenv = require('dotenv');

const test = async () => {
    try {
        console.log('Fetching from http://localhost:5000/api/categories/stats ...');
        const res = await axios.get('http://localhost:5000/api/categories/stats', { timeout: 10000 });
        console.log('Status:', res.status);
        console.log('Data summary:', {
            categoriesCount: res.data.categoriesCount,
            shopsCount: res.data.shopsCount,
            creatorsCount: res.data.creatorsCount,
            firstFewStats: Object.entries(res.data.categoryStats || {}).slice(0, 5)
        });
    } catch (err) {
        console.error('Error fetching stats:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', err.response.data);
        }
    }
};

test();
