const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test Credentials (ensure this user exists, or update)
const TEST_USER = {
    email: 'seller@test.com', // Corrected email from seed_seller.js
    password: 'password123'
};

async function runDebug() {
    try {
        console.log('1. Attempting Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, TEST_USER);
        const token = loginRes.data.token;
        console.log('✅ Login Success. Token obtained.');
        console.log('   User ID:', loginRes.data._id);

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        console.log('\n2. Testing /api/auth/profile (Instrumented for Trace)...');
        try {
            const profileRes = await axios.get(`${API_URL}/auth/profile`, config);
            console.log('✅ Profile Success:', profileRes.status);
        } catch (err) {
            console.error('❌ Profile Failed:');
            if (err.response) {
                console.error('   Status:', err.response.status);
                console.error('   Data:', JSON.stringify(err.response.data, null, 2));
            } else {
                console.error('   Network/Code Error:', err.message);
            }
        }

        console.log('\n3. Testing /api/seller/customer-visits...');
        try {
            const visitsRes = await axios.get(`${API_URL}/seller/customer-visits`, config);
            console.log('✅ Visits Success:', visitsRes.status);
            console.log('   Data:', JSON.stringify(visitsRes.data, null, 2));
        } catch (err) {
            console.error('❌ Visits Failed:');
            if (err.response) {
                console.error('   Status:', err.response.status);
                // console.error('   Data:', JSON.stringify(err.response.data, null, 2));
            } else {
                console.error('   Network/Code Error:', err.message);
            }
        }

    } catch (error) {
        console.error('❌ FATAL: Script failed at top level.');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        } else if (error.request) {
            console.error('   Network Error: No response received. Server might be down.');
            console.error('   Message:', error.message);
        } else {
            console.error('   Code Error:', error.message);
        }
    }
}

runDebug();
