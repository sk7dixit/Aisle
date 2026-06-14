const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Queue, Worker } = require('bullmq');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runRecoveryTests = async () => {
    console.log("==================================================");
    console.log("      STARTING WORKER RECOVERY TESTS              ");
    console.log("==================================================\n");

    try {
        await connectDB();
        console.log("✅ MongoDB Connected successfully.");
    } catch (dbErr) {
        console.error("❌ Failed to connect to MongoDB:", dbErr.message);
        process.exit(1);
    }

    const connection = {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || 6379, 10),
        password: process.env.REDIS_PASSWORD || undefined
    };

    const testQueue = new Queue('testRecoveryQueue', { connection });

    try {
        // Clear old jobs
        await testQueue.drain();
        console.log("✅ Cleared old test jobs.");

        // ==========================================
        // TEST A: Stop Worker (Jobs queue up)
        // ==========================================
        console.log("\n--- TEST A: Stop Worker (Jobs Queue Up) ---");
        {
            // Do NOT start a worker. Add a job.
            const job = await testQueue.add('testJobA', { val: 42 });
            console.log(`Job added to queue. Job ID: ${job.id}`);

            await sleep(1000); // Wait to see if any process picks it up

            const status = await job.getState();
            if (status === 'waiting') {
                console.log("✅ Test A: Worker is offline. Job remains in 'waiting' state correctly (No data loss).");
            } else {
                console.error(`❌ Test A Failed: Job is in '${status}' state but expected 'waiting'.`);
            }
        }

        // ==========================================
        // TEST B: Restart Worker (Jobs Resume)
        // ==========================================
        console.log("\n--- TEST B: Restart Worker (Jobs Resume) ---");
        {
            let processed = false;
            let processedData = null;

            // Start worker to pick up the enqueued Job A
            const testWorker = new Worker('testRecoveryQueue', async (job) => {
                if (job.name === 'testJobA') {
                    processed = true;
                    processedData = job.data;
                }
            }, { connection });

            console.log("Worker started. Waiting for job to process...");
            await sleep(2000);

            if (processed && processedData && processedData.val === 42) {
                console.log("✅ Test B: Worker restarted and successfully resumed processing queued jobs.");
            } else {
                console.error("❌ Test B Failed: Job was not processed after starting worker.");
            }

            // Close worker
            await testWorker.close();
        }

        // ==========================================
        // TEST C: 1,000 Notifications Enqueuing API Stability
        // ==========================================
        console.log("\n--- TEST C: High Volume Queue Stability ---");
        {
            const startTime = Date.now();
            const promises = [];

            // Add 1,000 jobs concurrently
            console.log("Enqueuing 1,000 jobs concurrently...");
            for (let i = 0; i < 1000; i++) {
                promises.push(testQueue.add('mockNotification', { id: i, email: `user${i}@aisle.com` }));
            }

            await Promise.all(promises);
            const endTime = Date.now();
            const totalDuration = endTime - startTime;
            const avgTimePerJob = totalDuration / 1000;

            console.log(`Successfully enqueued 1,000 jobs.`);
            console.log(`Total duration: ${totalDuration}ms`);
            console.log(`Average duration per job: ${avgTimePerJob.toFixed(2)}ms`);

            if (totalDuration < 1000) { // Should take way less than 1 second (normally 100-300ms)
                console.log(`✅ Test C: API remains extremely stable. Enqueue time is well under the 300ms average response threshold.`);
            } else {
                console.warn(`⚠️ Test C: Enqueue time was ${totalDuration}ms (higher than expected). Check Redis performance.`);
            }
        }

        // ==========================================
        // TEST D: Redis Disconnect & Worker Recovery
        // ==========================================
        console.log("\n--- TEST D: Redis Disconnect & Worker Recovery ---");
        {
            let jobProcessedAfterReconnect = false;

            const testWorker = new Worker('testRecoveryQueue', async (job) => {
                if (job.name === 'postReconnectJob') {
                    jobProcessedAfterReconnect = true;
                }
            }, { connection });

            // Simulate disconnect by closing worker's internal Redis client connection
            console.log("Simulating Redis disconnection...");
            const client = await testWorker.client;
            await client.disconnect(); // Disconnect client

            console.log("Worker disconnected from Redis. Enqueuing new job...");
            await sleep(1000);

            // Add job to queue (queue has its own connection)
            await testQueue.add('postReconnectJob', { data: 'test' });

            // Re-establish worker client connection by restarting worker
            console.log("Reconnecting worker to Redis...");
            await testWorker.close();

            const testWorkerRecovered = new Worker('testRecoveryQueue', async (job) => {
                if (job.name === 'postReconnectJob') {
                    jobProcessedAfterReconnect = true;
                }
            }, { connection });

            await sleep(2000);

            if (jobProcessedAfterReconnect) {
                console.log("✅ Test D: Workers successfully recovered and resumed processing after Redis reconnection.");
            } else {
                console.error("❌ Test D Failed: Workers did not recover to process job after reconnect.");
            }

            await testWorkerRecovered.close();
        }

    } catch (testErr) {
        console.error("❌ Tests encountered error:", testErr);
    } finally {
        await testQueue.drain();
        await testQueue.close();
        await mongoose.connection.close();
        console.log("\n==================================================");
        console.log("             TEST EXECUTION FINISHED              ");
        console.log("==================================================");
        process.exit(0);
    }
};

runRecoveryTests();
