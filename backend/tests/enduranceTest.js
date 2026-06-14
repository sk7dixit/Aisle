const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const TARGET_URL = 'http://localhost:5000/health';
const TOTAL_REQUESTS = 10000;
const BATCH_SIZE = 100;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runEnduranceTest() {
    console.log('🏁 Starting Endurance & SLA Verification Load Test...');
    console.log(`Target: ${TARGET_URL}`);
    console.log(`Volume: ${TOTAL_REQUESTS} total requests in batches of ${BATCH_SIZE} concurrent workers.\n`);

    const latencies = [];
    let successCount = 0;
    let failureCount = 0;

    // 1. Capture Baseline Memory
    console.log('Fetching baseline metrics from server...');
    let baselineRes;
    try {
        baselineRes = await axios.get(TARGET_URL);
        const baselineMem = baselineRes.data.system.memoryUsage;
        console.log(`📊 Baseline Server Memory:`);
        console.log(`   RSS: ${Math.round(baselineMem.rss / 1024 / 1024)} MB`);
        console.log(`   Heap Total: ${Math.round(baselineMem.heapTotal / 1024 / 1024)} MB`);
        console.log(`   Heap Used: ${Math.round(baselineMem.heapUsed / 1024 / 1024)} MB\n`);
    } catch (err) {
        console.error('❌ Failed to connect to server. Is the backend server running on port 5000?', err.message);
        process.exit(1);
    }

    const startTime = Date.now();

    // 2. Run Batches
    const totalBatches = TOTAL_REQUESTS / BATCH_SIZE;
    for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
        const batchPromises = [];

        for (let i = 0; i < BATCH_SIZE; i++) {
            const reqStart = Date.now();
            const promise = axios.get(TARGET_URL, { timeout: 10000 })
                .then(() => {
                    latencies.push(Date.now() - reqStart);
                    successCount++;
                })
                .catch((err) => {
                    latencies.push(Date.now() - reqStart);
                    failureCount++;
                });
            batchPromises.push(promise);
        }

        await Promise.all(batchPromises);

        if (batchNum % 10 === 0 || batchNum === totalBatches) {
            const progressPercent = Math.round((batchNum / totalBatches) * 100);
            const tempSorted = [...latencies].sort((a, b) => a - b);
            const tempP50 = tempSorted[Math.floor(tempSorted.length * 0.5)] || 0;
            const tempP95 = tempSorted[Math.floor(tempSorted.length * 0.95)] || 0;
            console.log(`⏳ Progress: ${progressPercent}% (${latencies.length}/${TOTAL_REQUESTS}) | Current Batch P50: ${tempP50}ms | P95: ${tempP95}ms`);
        }
    }

    const testDurationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nLoad test completed in ${testDurationSec} seconds.`);

    // 3. Calculate SLA Latency Stats
    latencies.sort((a, b) => a - b);
    const min = latencies[0] || 0;
    const max = latencies[latencies.length - 1] || 0;
    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / latencies.length) || 0;
    const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
    const p90 = latencies[Math.floor(latencies.length * 0.90)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

    const under200msCount = latencies.filter(l => l < 200).length;
    const slaPercent = ((under200msCount / latencies.length) * 100).toFixed(2);

    console.log('\n⏱️ --- Latency & SLA Performance ---');
    console.log(`    Total Requests: ${latencies.length}`);
    console.log(`    Successful:     ${successCount}`);
    console.log(`    Failed:         ${failureCount}`);
    console.log(`    Min Latency:    ${min} ms`);
    console.log(`    Max Latency:    ${max} ms`);
    console.log(`    Avg Latency:    ${avg} ms`);
    console.log(`    P50 Latency:    ${p50} ms`);
    console.log(`    P90 Latency:    ${p90} ms`);
    console.log(`    P95 Latency:    ${p95} ms (SLA Target: < 200ms)`);
    console.log(`    P99 Latency:    ${p99} ms`);
    console.log(`    SLA Compliance: ${slaPercent}% (< 200ms)`);

    // 4. Cool down and capture Post-test Memory
    console.log('\nAllowing server 5 seconds to settle and run garbage collection...');
    await sleep(5000);

    let postRes;
    try {
        postRes = await axios.get(TARGET_URL);
        const postMem = postRes.data.system.memoryUsage;
        const baselineMem = baselineRes.data.system.memoryUsage;

        const rssChange = Math.round((postMem.rss - baselineMem.rss) / 1024 / 1024);
        const heapUsedChange = Math.round((postMem.heapUsed - baselineMem.heapUsed) / 1024 / 1024);

        console.log(`\n📊 Post-Load Server Memory:`);
        console.log(`   RSS: ${Math.round(postMem.rss / 1024 / 1024)} MB (Diff: ${rssChange > 0 ? '+' : ''}${rssChange} MB)`);
        console.log(`   Heap Total: ${Math.round(postMem.heapTotal / 1024 / 1024)} MB`);
        console.log(`   Heap Used: ${Math.round(postMem.heapUsed / 1024 / 1024)} MB (Diff: ${heapUsedChange > 0 ? '+' : ''}${heapUsedChange} MB)`);

        let status = 'SUCCESS';
        if (heapUsedChange > 30) {
            console.error('\n⚠️ WARNING: Potential memory growth detected. Heap used increased by > 30MB after load test.');
            status = 'WARNING';
        } else {
            console.log('\n✅ Memory baseline recovered successfully. No major memory leaks detected.');
        }

        if (p95 > 200) {
            console.error(`⚠️ WARNING: SLA P95 Target was breached (P95: ${p95}ms, Target: < 200ms)`);
            status = 'WARNING';
        } else {
            console.log('✅ SLA P95 performance targets met.');
        }

        if (failureCount > 0) {
            console.error(`⚠️ WARNING: There were ${failureCount} failed requests during the load test.`);
            status = 'WARNING';
        }

        console.log(`\n🏁 Endurance Test Finished. Status: ${status}`);
        process.exit(status === 'SUCCESS' ? 0 : 1);
    } catch (err) {
        console.error('❌ Failed to fetch post-test metrics from server:', err.message);
        process.exit(1);
    }
}

runEnduranceTest();
