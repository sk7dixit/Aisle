const autocannon = require('autocannon');

const run = async () => {
    console.log('Running workspace debug autocannon...');
    const result = await autocannon({
        url: 'http://localhost:5000/api/auth/login',
        connections: 5,
        duration: 2,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
    });
    console.log('Keys of result:', Object.keys(result));
    console.log('statusCodeStats:', result.statusCodeStats);
    console.log('requests:', result.requests);
    console.log('throughput:', result.throughput);
    console.log('1xx:', result['1xx']);
    console.log('2xx:', result['2xx']);
    console.log('3xx:', result['3xx']);
    console.log('4xx:', result['4xx']);
    console.log('5xx:', result['5xx']);
    console.log('non2xx:', result.non2xx);
    process.exit(0);
};

run().catch(console.error);
