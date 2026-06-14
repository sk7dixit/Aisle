const axios = require('axios');

async function testOtp() {
    try {
        console.log('Sending request to /api/auth/send-otp...');
        const response = await axios.post('http://localhost:5000/api/auth/send-otp', {
            email: 'testregistration123@gmail.com'
        });
        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
    } catch (err) {
        console.error('Error sending OTP:', err.message);
        if (err.response) {
            console.error('Error Status:', err.response.status);
            console.error('Error Data:', err.response.data);
        } else {
            console.error('No response received:', err);
        }
    }
}

testOtp();
