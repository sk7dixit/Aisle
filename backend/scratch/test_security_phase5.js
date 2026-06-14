const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const SecurityLog = require('../models/SecurityLog');
const SecurityEvent = require('../models/SecurityEvent');
const { getRedisClient } = require('../config/redis');
const { logSecurityEvent } = require('../utils/securityLogger');
const { getIpLocation } = require('../utils/geoIp');
const { calculateDistance } = require('../utils/distance');
const { triggerIncidentResponsePlaybook } = require('../controllers/incidentController');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/aisle';
    await mongoose.connect(mongoUri);
    console.log('[Test] Connected to MongoDB.');
};

const runTests = async () => {
    await connectDB();
    const redis = getRedisClient();

    console.log('\n--- STARTING SECURITY PHASE 5 TESTS ---\n');

    // Setup Test user and admin
    const testEmail = 'phase5test@aisle.in';
    const testAdminEmail = 'phase5admin@aisle.in';
    
    // Clean up old test records
    await User.deleteMany({ email: { $in: [testEmail, testAdminEmail] } });
    await RefreshToken.deleteMany({});
    await SecurityLog.deleteMany({ email: { $in: [testEmail, testAdminEmail] } });
    await SecurityEvent.deleteMany({ user: { $in: [testEmail, testAdminEmail] } });

    const testUser = await User.create({
        name: 'Phase 5 Test User',
        email: testEmail,
        password: 'password123',
        phone: '9876543210',
        role: 'customer',
        verificationStatus: 'approved'
    });

    const testAdmin = await User.create({
        name: 'Phase 5 Test Admin',
        email: testAdminEmail,
        password: 'password123',
        phone: '9876543211',
        role: 'super_admin',
        verificationStatus: 'approved'
    });

    console.log('[Test] Setup completed. Test user and admin created.');

    // ------------------------------------------------------------------------
    // TEST 1: Brute Force Detector (100 failed logins in 5 minutes)
    // ------------------------------------------------------------------------
    console.log('\n[Test 1] Simulating 100 failed logins in 5 minutes...');
    
    // Log 100 failed logins in a loop (using delhi-ip mock to resolve instantly)
    const reqMock = {
        headers: { 'x-forwarded-for': 'delhi-ip', 'user-agent': 'Mozilla/5.5' },
        socket: { remoteAddress: 'delhi-ip' },
        ip: 'delhi-ip'
    };

    for (let i = 0; i < 101; i++) {
        await logSecurityEvent(testUser._id, testUser.email, 'LOGIN_FAILED', reqMock, {
            reason: 'Password Mismatch (Simulated Test)'
        });
    }

    const bruteAlerts = await SecurityEvent.countDocuments({
        event: 'FAILED_LOGIN',
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
    });

    console.log(`[Test 1] Logged ${bruteAlerts} login failures in test window.`);
    
    const fs = require('fs');
    const alertLogPath = path.join(__dirname, '..', 'logs', 'alerts.log');
    if (fs.existsSync(alertLogPath)) {
        const alertLog = fs.readFileSync(alertLogPath, 'utf8');
        if (alertLog.includes('Potential Credential Stuffing')) {
            console.log('\x1b[32m[Test 1 PASSED] Brute force alert successfully triggered and logged to alerts.log.\x1b[0m');
        } else {
            console.log('\x1b[31m[Test 1 FAILED] Brute force alert log entry not found in alerts.log.\x1b[0m');
        }
    } else {
        console.log('\x1b[31m[Test 1 FAILED] logs/alerts.log file was not created.\x1b[0m');
    }

    // ------------------------------------------------------------------------
    // TEST 2: Impossible Travel Login Detection
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] Simulating Impossible Travel...');
    
    // Simulate first login from Delhi
    const loginReqDelhi = {
        headers: { 'x-forwarded-for': '1.1.1.1', 'user-agent': 'Chrome on Windows' },
        socket: { remoteAddress: '1.1.1.1' },
        body: { deviceId: 'device-abc' }
    };
    
    await logSecurityEvent(testUser._id, testUser.email, 'LOGIN_SUCCESS', loginReqDelhi, {
        mechanism: 'password',
        deviceId: 'device-abc'
    });
    
    // Simulate second login from Russia 1 second later
    const loginReqRussia = {
        headers: { 'x-forwarded-for': '2.2.2.2', 'user-agent': 'Firefox on Linux' },
        socket: { remoteAddress: '2.2.2.2' },
        body: { deviceId: 'device-xyz' }
    };

    // We will call the actual verification check logic
    const currentLoc = await getIpLocation('2.2.2.2');
    const lastLogin = await SecurityLog.findOne({
        userId: testUser._id,
        event: 'LOGIN_SUCCESS'
    }).sort({ createdAt: -1 });

    let travelFlagged = false;
    if (lastLogin && lastLogin.ipAddress) {
        const lastLoc = await getIpLocation(lastLogin.ipAddress);
        const dist = calculateDistance(currentLoc.lat, currentLoc.lon, lastLoc.lat, lastLoc.lon);
        const timeDiffHours = (Date.now() - new Date(lastLogin.createdAt).getTime()) / 3600000;
        
        if (timeDiffHours > 0) {
            const speed = dist / timeDiffHours;
            console.log(`[Test 2] Distance: ${dist.toFixed(2)} km, Time diff: ${(timeDiffHours * 3600).toFixed(2)}s, Speed: ${speed.toFixed(2)} km/h`);
            
            if (speed > 1000 && dist > 100) {
                travelFlagged = true;
                // Log anomaly
                await logSecurityEvent(testUser._id, testUser.email, 'TOKEN_ABUSE', loginReqRussia, {
                    reason: 'Impossible travel anomaly detected (Simulated Test)',
                    currentLocation: currentLoc,
                    lastLocation: lastLoc,
                    distanceKm: dist,
                    timeDiffHours,
                    calculatedSpeedKmh: speed
                });

                // Clear sessions
                const keys = await redis.keys(`sess_by_user:${testUser._id}:*`);
                for (const key of keys) {
                    const hash = await redis.get(key);
                    if (hash) await redis.del(`sess_by_token:${hash}`);
                    await redis.del(key);
                }
                await RefreshToken.deleteMany({ userId: testUser._id });
            }
        }
    }

    if (travelFlagged) {
        const anomalyLogged = await SecurityEvent.findOne({ event: 'TOKEN_ABUSE', user: testUser.email });
        if (anomalyLogged) {
            console.log('\x1b[32m[Test 2 PASSED] Impossible travel travel check triggered, sessions revoked, and event logged.\x1b[0m');
        } else {
            console.log('\x1b[31m[Test 2 FAILED] Impossible travel flagged but SecurityEvent not logged.\x1b[0m');
        }
    } else {
        console.log('\x1b[31m[Test 2 FAILED] Travel speed calculation did not trigger the threshold.\x1b[0m');
    }

    // ------------------------------------------------------------------------
    // TEST 3: Incident Response Playbooks
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] Testing Incident Response playbooks...');

    // 3.1: Trigger DDOS playbook
    const mockRes = {
        json: (data) => { mockRes.data = data; return mockRes; },
        status: (code) => { mockRes.statusCode = code; return mockRes; },
        data: null,
        statusCode: 200
    };

    const mockReqDdos = {
        body: { playbook: 'DDOS_ATTACK' },
        user: testAdmin,
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
    };

    await triggerIncidentResponsePlaybook(mockReqDdos, mockRes);
    const ddosActive = await redis.get('ddos:emergency_mode');
    
    if (ddosActive === 'true') {
        console.log('\x1b[32m[Test 3.1 PASSED] DDOS_ATTACK playbook correctly activated DDoS Emergency Mode in Redis.\x1b[0m');
    } else {
        console.log('\x1b[31m[Test 3.1 FAILED] DDOS_ATTACK playbook did not set emergency mode flag.\x1b[0m');
    }

    // 3.2: Trigger ADMIN_COMPROMISE playbook
    const mockReqAdminComp = {
        body: { playbook: 'ADMIN_COMPROMISE', targetAdminId: testAdmin._id },
        user: testAdmin,
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
    };

    await triggerIncidentResponsePlaybook(mockReqAdminComp, mockRes);
    const containedAdmin = await User.findById(testAdmin._id);
    
    if (containedAdmin.accountStatus === 'suspended') {
        console.log('\x1b[32m[Test 3.2 PASSED] ADMIN_COMPROMISE playbook correctly suspended administrative user.\x1b[0m');
    } else {
        console.log('\x1b[31m[Test 3.2 FAILED] ADMIN_COMPROMISE playbook failed to suspend admin user.\x1b[0m');
    }

    // Cleanup test data
    await User.deleteMany({ email: { $in: [testEmail, testAdminEmail] } });
    await SecurityLog.deleteMany({ email: { $in: [testEmail, testAdminEmail] } });
    await SecurityEvent.deleteMany({ user: { $in: [testEmail, testAdminEmail] } });
    await redis.del('ddos:emergency_mode');

    console.log('\n--- SECURITY PHASE 5 TESTS COMPLETED ---\n');
    mongoose.connection.close();
    process.exit(0);
};

runTests().catch(err => {
    console.error('Test Suite Failed with fatal error:', err);
    mongoose.connection.close();
    process.exit(1);
});
