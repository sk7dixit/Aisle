const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

const Redis = require('ioredis');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

const API_URL = 'http://localhost:5000/api';

function hasCollScan(plan) {
    if (!plan) return false;
    if (plan.stage === 'COLLSCAN') {
        return true;
    }
    if (plan.inputStage) {
        if (hasCollScan(plan.inputStage)) return true;
    }
    if (plan.inputStages && Array.isArray(plan.inputStages)) {
        for (const subPlan of plan.inputStages) {
            if (hasCollScan(subPlan)) return true;
        }
    }
    return false;
}

async function run() {
    console.log('Connecting to MongoDB for query audit verification...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Find or create an admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
        admin = await User.findOne({ role: 'super_admin' });
    }
    if (!admin) {
        console.log('Creating a mock admin user...');
        admin = await User.create({
            name: 'Mock Admin Auditor',
            email: 'admin-auditor@test.com',
            password: 'password123',
            role: 'admin',
            verificationStatus: 'approved'
        });
    }

    // 2. Connect to Redis and set up a session to satisfy the auth continuous session check
    const redis = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || 6379, 10),
        password: process.env.REDIS_PASSWORD || undefined
    });

    console.log('Registering mock admin session in Redis...');
    await redis.set(`session:${admin._id}:testsession`, 'active', 'EX', 3600);

    // 3. Sign JWT token
    const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET || process.env.JWT_SECRET_CURRENT || 'fallbacksecret',
        { expiresIn: '1h' }
    );

    // 4. Request query audit
    console.log('Fetching query audit logs from backend...');
    let auditData;
    try {
        const response = await axios.get(`${API_URL}/admin/query-audit`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-bypass-rate-limit': process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026'
            }
        });
        auditData = response.data;
    } catch (err) {
        console.error('Failed to query backend admin audit endpoint:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', err.response.data);
        }
        await redis.del(`session:${admin._id}:testsession`);
        await redis.quit();
        await mongoose.disconnect();
        process.exit(1);
    }

    // Clean up Redis session
    await redis.del(`session:${admin._id}:testsession`);
    await redis.quit();

    if (!auditData || !auditData.success || !auditData.audits) {
        console.error('Invalid audit response received from backend:', auditData);
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log('\n--- Analyzing Query Plans ---');

    let failed = 0;

    // Check Compound Index Search
    const compoundIndexPlan = auditData.audits.productCompoundIndexSearch?.stages;
    if (!compoundIndexPlan) {
        console.error('[FAIL] Product Compound Index winning plan not returned in audit.');
        failed++;
    } else {
        const isCollScan = hasCollScan(compoundIndexPlan);
        if (isCollScan) {
            console.error('[FAIL] Product Compound Index Search performs a COLLSCAN!');
            console.error(JSON.stringify(compoundIndexPlan, null, 2));
            failed++;
        } else {
            console.log('[PASS] Product Compound Index Search: Index successfully used (No COLLSCAN).');
        }
    }

    // Check Geospatial Seller Location Search
    const geoPlan = auditData.audits.sellerGeoSphereSearch?.stages;
    if (!geoPlan) {
        console.error('[FAIL] Seller GeoSphere winning plan not returned in audit.');
        failed++;
    } else {
        const isCollScan = hasCollScan(geoPlan);
        if (isCollScan) {
            console.error('[FAIL] Seller GeoSphere Search performs a COLLSCAN!');
            console.error(JSON.stringify(geoPlan, null, 2));
            failed++;
        } else {
            console.log('[PASS] Seller GeoSphere Search: Geospatial index successfully used (No COLLSCAN).');
        }
    }

    // Check Product Regex Search (Audit check: note if it COLLSCANs without index constraints)
    const regexPlan = auditData.audits.productRegexSearch?.stages;
    if (regexPlan) {
        const isCollScan = hasCollScan(regexPlan);
        console.log(`[INFO] Product Regex Search (Unconstrained): COLLSCAN = ${isCollScan}`);
    }

    // Cleanup
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');

    if (failed === 0) {
        console.log('\n✅ ALL DATABASE INDEX ASSERTIONS PASSED');
        process.exit(0);
    } else {
        console.error(`\n❌ ${failed} DATABASE INDEX ASSERTIONS FAILED`);
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Fatal Query Audit Test Error:', err);
    process.exit(1);
});
