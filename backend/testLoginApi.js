const axios = require('axios');

const test = async () => {
    try {
        console.log('Sending login POST request...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'shoplens017@gmail.com',
            password: 'Admin@123'
        });
        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
    } catch (err) {
        if (err.response) {
            console.log('Error Status:', err.response.status);
            console.log('Error Data:', err.response.data);
        } else {
            console.error('Error message:', err.message);
        }
    }
};

test();
