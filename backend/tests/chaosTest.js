const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
const { getRedisClient, isRedisActive } = require('../config/redis');
const { sendGridCircuit, redisCircuit, mongoCircuit } = require('../utils/circuitBreaker');
const { sendEmail } = require('../services/sendGridService');
const FailedNotification = require('../models/FailedNotification');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runChaosTests() {
    console.log('🏁 Starting Chaos Resilience Tests...\n');
    let success = true;

    // Connect to Database
    const connectDB = require('../config/db');
    await connectDB();

    // Clear failed notifications before starting
    await FailedNotification.deleteMany({});

    // ==========================================
    // TEST 1: SendGrid Down -> Circuit Breaker & Fallback Queueing
    // ==========================================
    console.log('--- TEST 1: SendGrid Outage Simulation ---');
    
    // Save original sgMail send method
    const originalSend = sgMail.send;
    
    // Mock SendGrid failing
    sgMail.send = async () => {
        throw new Error('SendGrid API Timeout (Simulated Outage)');
    };

    try {
        console.log('Sending 3 emails to trigger SendGrid circuit breaker...');
        for (let i = 0; i < 3; i++) {
            await sendEmail({
                to: 'chaos-test@aisle.in',
                subject: `Test Alert ${i}`,
                text: 'Simulated email'
            });
        }

        console.log(`SendGrid Circuit state: ${sendGridCircuit.state}`);
        if (sendGridCircuit.state !== 'OPEN') {
            console.error('❌ Test 1 Failed: SendGrid circuit breaker did not transition to OPEN.');
            success = false;
        } else {
            console.log('✅ SendGrid Circuit transitioned to OPEN successfully.');
        }

        // Send a 4th email while circuit is OPEN
        console.log('Sending 4th email (should fail-fast and fallback to DB queue)...');
        const result = await sendEmail({
            to: 'chaos-test-fallback@aisle.in',
            subject: 'Fallback Test',
            text: 'This should be queued'
        });

        // Verify it returned false (indicating fallback was used)
        if (result === false) {
            console.log('✅ sendEmail returned false (graceful degradation fallback).');
        } else {
            console.error('❌ Test 1 Failed: sendEmail did not return false on fallback.');
            success = false;
        }

        // Verify the notification is in the database
        const queuedCount = await FailedNotification.countDocuments({ to: 'chaos-test-fallback@aisle.in' });
        if (queuedCount === 1) {
            console.log('✅ Verified 1 failed notification queued in the database.');
        } else {
            console.error(`❌ Test 1 Failed: Expected 1 queued notification, found ${queuedCount}`);
            success = false;
        }
    } catch (err) {
        console.error('❌ Test 1 encountered an unexpected error:', err.message);
        success = false;
    } finally {
        // Restore original sgMail send method
        sgMail.send = originalSend;
        sendGridCircuit.state = 'CLOSED';
        sendGridCircuit.failureCount = 0;
    }

    console.log('\n------------------------------------------\n');

    // ==========================================
    // TEST 2: Redis Outage -> Circuit Breaker & Fallback to DB
    // ==========================================
    console.log('--- TEST 2: Redis Outage Simulation ---');

    try {
        const testAction = async () => {
            throw new Error('Redis Connection Timed Out (Simulated Outage)');
        };

        const testFallback = async () => {
            console.log('[Fallback] Returning database mock fallback.');
            return { source: 'database', data: [] };
        };

        console.log('Executing action 5 times to trigger Redis circuit breaker...');
        for (let i = 0; i < 5; i++) {
            try {
                await redisCircuit.execute(testAction, testFallback);
            } catch (e) {}
        }

        console.log(`Redis Circuit state: ${redisCircuit.state}`);
        if (redisCircuit.state !== 'OPEN') {
            console.error('❌ Test 2 Failed: Redis circuit breaker did not transition to OPEN.');
            success = false;
        } else {
            console.log('✅ Redis Circuit transitioned to OPEN successfully.');
        }

        // Execute 6th time (should fail fast to fallback directly)
        console.log('Executing 6th action (should fail-fast instantly)...');
        const start = Date.now();
        const res = await redisCircuit.execute(testAction, testFallback);
        const duration = Date.now() - start;

        if (res.source === 'database' && duration < 50) {
            console.log(`✅ Verified fast fallback execution in ${duration}ms.`);
        } else {
            console.error(`❌ Test 2 Failed: Fallback source: ${res.source}, duration: ${duration}ms`);
            success = false;
        }
    } catch (err) {
        console.error('❌ Test 2 encountered an unexpected error:', err.message);
        success = false;
    } finally {
        redisCircuit.state = 'CLOSED';
        redisCircuit.failureCount = 0;
    }

    console.log('\n------------------------------------------\n');

    // ==========================================
    // TEST 3: MongoDB Outage -> Circuit Breaker & Fail Fast
    // ==========================================
    console.log('--- TEST 3: MongoDB Outage Simulation ---');

    try {
        const testAction = async () => {
            throw new Error('Mongoose query failed (Simulated Replica Failover)');
        };

        console.log('Executing query 5 times to trigger MongoDB circuit breaker...');
        for (let i = 0; i < 5; i++) {
            try {
                await mongoCircuit.execute(testAction);
            } catch (e) {}
        }

        console.log(`MongoDB Circuit state: ${mongoCircuit.state}`);
        if (mongoCircuit.state !== 'OPEN') {
            console.error('❌ Test 3 Failed: MongoDB circuit breaker did not transition to OPEN.');
            success = false;
        } else {
            console.log('✅ MongoDB Circuit transitioned to OPEN successfully.');
        }

        // Expect immediate exception on execution without fallback
        let threwFast = false;
        try {
            await mongoCircuit.execute(testAction);
        } catch (err) {
            if (err.message.includes('is OPEN')) {
                threwFast = true;
            }
        }

        if (threwFast) {
            console.log('✅ MongoDB circuit failed-fast instantly with expected message.');
        } else {
            console.error('❌ Test 3 Failed: MongoDB did not fail-fast with expected error.');
            success = false;
        }
    } catch (err) {
        console.error('❌ Test 3 encountered an unexpected error:', err.message);
        success = false;
    } finally {
        mongoCircuit.state = 'CLOSED';
        mongoCircuit.failureCount = 0;
    }

    // Clean up connections
    await mongoose.connection.close();
    if (isRedisActive()) {
        await getRedisClient().quit();
    }

    console.log('\n🏁 Chaos Resilience Testing Finished.');
    if (success) {
        console.log('🎉 ALL CHAOS TESTS PASSED SUCCESSFULLY!');
        process.exit(0);
    } else {
        console.error('❌ SOME CHAOS TESTS FAILED.');
        process.exit(1);
    }
}

runChaosTests();
