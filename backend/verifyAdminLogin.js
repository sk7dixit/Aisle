const http = require('http');

const data = JSON.stringify({
    email: 'shoplens017@gmail.com',
    password: 'Admin@123'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log('Response Body:', responseBody);

        if (res.statusCode === 200) {
            console.log('Login verification SUCCESS');
            process.exit(0);
        } else {
            console.log('Login verification FAILED');
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});

req.write(data);
req.end();
