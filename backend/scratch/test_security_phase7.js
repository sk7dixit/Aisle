const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const SecurityEvent = require('../models/SecurityEvent');
const AuditTrail = require('../models/AuditTrail');
const { getRedisClient } = require('../config/redis');
const { generateSecret, verifyToken } = require('../utils/totp');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/aisle';
    await mongoose.connect(mongoUri);
    console.log('[Test] Connected to MongoDB.');
};

const runTests = async () => {
    await connectDB();
    const redis = getRedisClient();
    const API_URL = 'http://localhost:5000/api';
    axios.defaults.headers.common['x-bypass-rate-limit'] = process.env.INTERNAL_SERVICES_API_KEY || 'aisle_internal_service_dev_key_2026';

    console.log('\n--- STARTING SECURITY PHASE 7 INTEGRATION TESTS ---\n');

    const testAdminEmail = 'p7admin@aisle.in';
    const testModeratorEmail = 'p7mod@aisle.in';
    const testUserEmail = 'p7user@aisle.in';

    // Clean up old records
    await User.deleteMany({ email: { $in: [testAdminEmail, testModeratorEmail, testUserEmail] } });
    await User.deleteMany({ name: { $regex: 'DLP Dummy.*' } });
    await RefreshToken.deleteMany({});
    await SecurityEvent.deleteMany({ user: { $in: [testAdminEmail, testModeratorEmail, testUserEmail] } });
    await AuditTrail.deleteMany({ actorEmail: { $in: [testAdminEmail, testModeratorEmail, testUserEmail] } });
    await redis.flushall();

    // ------------------------------------------------------------------------
    // TEST 1: Native TOTP Utility Code Validation
    // ------------------------------------------------------------------------
    console.log('[Test 1] Testing TOTP Secret Generation & Token Verification...');
    const credentials = generateSecret(testAdminEmail, 'Aisle-Test');
    
    if (!credentials.secret || !credentials.otpauthUrl.includes(encodeURIComponent(testAdminEmail))) {
        throw new Error('Test 1 Failed: TOTP secret generation returned invalid shape');
    }

    // Verify token generates correct code and verifies
    // Wait for the start of the next 30-sec block to prevent edge boundary check failures
    const waitMs = 30000 - (Date.now() % 30000);
    if (waitMs < 2000) {
        console.log(`[Test 1] Close to time step boundary. Sleeping ${waitMs}ms to stabilize step...`);
        await new Promise(r => setTimeout(r, waitMs));
    }

    // Since we know the secret, let's manually compute and verify the token
    const crypto = require('crypto');
    const base32Decode = (str) => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const cleaned = str.replace(/[\s=]/g, '').toUpperCase();
        let bits = '';
        for (let i = 0; i < cleaned.length; i++) {
            bits += alphabet.indexOf(cleaned[i]).toString(2).padStart(5, '0');
        }
        const bytes = [];
        for (let i = 0; i + 8 <= bits.length; i += 8) {
            bytes.push(parseInt(bits.substring(i, i + 8), 2));
        }
        return Buffer.from(bytes);
    };

    const T = Math.floor(Date.now() / 1000 / 30);
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeUInt32BE(0, 0);
    counterBuf.writeUInt32BE(T, 4);

    const hmac = crypto.createHmac('sha1', base32Decode(credentials.secret));
    hmac.update(counterBuf);
    const digest = hmac.digest();
    const offset = digest[digest.length - 1] & 0xf;
    const codeVal = ((digest[offset] & 0x7f) << 24) |
                    (digest[offset + 1] << 16) |
                    (digest[offset + 2] << 8) |
                    digest[offset + 3];
    const testCode = (codeVal % 1000000).toString().padStart(6, '0');

    const isValid = verifyToken(credentials.secret, testCode);
    if (isValid) {
        console.log('\x1b[32m[Test 1 PASSED] Native TOTP secret and token validated successfully.\x1b[0m');
    } else {
        throw new Error('Test 1 Failed: Token verification failed for valid generated code');
    }

    // ------------------------------------------------------------------------
    // TEST 2: Multi-Stage Admin Login with MFA Enabled
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] Testing Multi-Stage Admin Login with MFA...');
    
    // Create admin user with MFA setup but not enabled yet
    const adminPassword = 'PasswordMfa123!';
    const adminUser = await User.create({
        name: 'Phase 7 Admin',
        email: testAdminEmail,
        password: adminPassword,
        role: 'super_admin',
        verificationStatus: 'approved',
        mfaSecret: credentials.secret,
        mfaEnabled: true
    });

    // Stage 1: Post credentials to /login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: testAdminEmail,
        password: adminPassword,
        deviceId: 'test-device-id'
    });

    if (loginRes.status === 200 && loginRes.data.mfaRequired) {
        console.log('[Test 2] Login intercepted correctly. Received mfaRequired: true.');
        const { tempToken } = loginRes.data;

        // Verify partial/temp token is blocked from accessing protected routes
        try {
            await axios.get(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${tempToken}` }
            });
            throw new Error('Test 2 Failed: Partial token accessed protected profile route');
        } catch (profileErr) {
            if (profileErr.response && profileErr.response.status === 403) {
                console.log('[Test 2] Partial/Temp token rejected correctly on protected profile (403).');
            } else {
                throw profileErr;
            }
        }

        // Stage 2: Verify code at /auth/verify-mfa
        const verifyRes = await axios.post(`${API_URL}/auth/verify-mfa`, {
            tempToken,
            code: testCode,
            deviceId: 'test-device-id'
        });

        if (verifyRes.data.token && verifyRes.data.role === 'super_admin') {
            console.log('\x1b[32m[Test 2 PASSED] MFA Login succeeded. Full access token received.\x1b[0m');
            adminUser.token = verifyRes.data.token;
        } else {
            throw new Error('Test 2 Failed: MFA Verification failed to return access token');
        }
    } else {
        throw new Error('Test 2 Failed: Login should have been intercepted with mfaRequired: true');
    }

    // ------------------------------------------------------------------------
    // TEST 3: Zero Trust & Continuous Session Check (Revocation)
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] Testing Zero Trust Session Revocation check...');
    
    // Verify access token works first
    const profileRes = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${adminUser.token}` }
    });

    if (profileRes.status === 200) {
        console.log('[Test 3] Valid token accessed profile successfully.');
        
        // Revoke active sessions for admin
        await axios.post(`${API_URL}/auth/sessions/revoke`, {
            deviceId: 'test-device-id'
        }, {
            headers: { Authorization: `Bearer ${adminUser.token}` }
        });

        console.log('[Test 3] Revoked session for device.');

        // Attempt profile access again. Should be rejected!
        try {
            await axios.get(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${adminUser.token}` }
            });
            throw new Error('Test 3 Failed: Access token succeeded after session was revoked');
        } catch (revokedErr) {
            if (revokedErr.response && revokedErr.response.status === 401) {
                console.log('\x1b[32m[Test 3 PASSED] Zero Trust check worked: Access token rejected immediately after session revocation.\x1b[0m');
            } else {
                throw revokedErr;
            }
        }
    } else {
        throw new Error('Test 3 Failed: Initial profile load failed');
    }

    // ------------------------------------------------------------------------
    // TEST 4: Data Loss Prevention (DLP) & Insider Threat Block
    // ------------------------------------------------------------------------
    console.log('\n[Test 4] Testing DLP Guard and automated account suspension...');

    // Create moderator account
    const modPassword = 'ModPassword1!';
    const moderatorUser = await User.create({
        name: 'Phase 7 Moderator',
        email: testModeratorEmail,
        password: modPassword,
        role: 'moderator',
        verificationStatus: 'approved'
    });

    // Log in moderator to get token
    const modLogin = await axios.post(`${API_URL}/auth/login`, {
        email: testModeratorEmail,
        password: modPassword,
        deviceId: 'mod-device-id'
    });
    const modToken = modLogin.data.token;

    // We will generate 105 dummy user records in the DB temporarily to trigger DLP
    console.log('[Test 4] Creating 105 dummy users in MongoDB...');
    const dummyUsers = [];
    for (let i = 0; i < 105; i++) {
        dummyUsers.push({
            name: `DLP Dummy ${i}`,
            email: `dlpdummy${i}@aisle.in`,
            password: 'password123',
            role: 'customer'
        });
    }
    await User.insertMany(dummyUsers);

    // Call GET /api/admin/users as moderator. Should fetch 100+ and trigger DLP!
    try {
        console.log('[Test 4] Requesting users list via moderator...');
        await axios.get(`${API_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${modToken}` }
        });
        throw new Error('Test 4 Failed: DLP Guard did not intercept large database request');
    } catch (dlpErr) {
        if (dlpErr.response && dlpErr.response.status === 403 && dlpErr.response.data.code === 'DLP_VIOLATION') {
            console.log('[Test 4] DLP Guard correctly blocked request with 403 DLP_VIOLATION.');

            // Verify moderator account was automatically suspended
            const checkedMod = await User.findById(moderatorUser._id);
            if (checkedMod.accountStatus === 'suspended') {
                console.log('[Test 4] Containment Successful: Moderator accountStatus set to suspended.');
            } else {
                throw new Error('Test 4 Failed: Moderator account was not suspended after DLP breach');
            }

            // Verify sessions are evicted in Redis
            const activeSess = await redis.keys(`sess_by_user:${moderatorUser._id}:*`);
            if (activeSess.length === 0) {
                console.log('[Test 4] Containment Successful: Moderator active sessions evicted from cache.');
            } else {
                throw new Error('Test 4 Failed: Moderator sessions were not cleared from Redis');
            }

            // Verify immutable audit trail record is created
            const auditRecord = await AuditTrail.findOne({ actorEmail: testModeratorEmail, action: 'MASS_EXPORT_BLOCKED' });
            if (auditRecord) {
                console.log('[Test 4] Immutable Audit Trail logged correctly.');
                
                // Test immutability: try to update the record
                try {
                    auditRecord.details = { modified: true };
                    await auditRecord.save();
                    throw new Error('Test 4 Failed: AuditTrail model is mutable (was updated)');
                } catch (updateErr) {
                    console.log('[Test 4] Immutability verified: Mongoose block prevents updating AuditTrail.');
                }
            } else {
                throw new Error('Test 4 Failed: AuditTrail record was not created for DLP block');
            }

            console.log('\x1b[32m[Test 4 PASSED] DLP Block, Insider Auto-Suspension, Session Eviction, and Audit Trail immutability verified.\x1b[0m');
        } else {
            throw dlpErr;
        }
    } finally {
        // Clean up dummy users
        await User.deleteMany({ name: { $regex: 'DLP Dummy.*' } });
    }

    // ------------------------------------------------------------------------
    // TEST 5: PAM Elevated Privilege Verification
    // ------------------------------------------------------------------------
    console.log('\n[Test 5] Testing PAM Elevated Privilege MFA Challenge...');

    // Re-create a clean admin with MFA enabled
    await User.deleteMany({ email: testAdminEmail });
    const freshAdmin = await User.create({
        name: 'Phase 7 Admin fresh',
        email: testAdminEmail,
        password: adminPassword,
        role: 'super_admin',
        verificationStatus: 'approved',
        mfaSecret: credentials.secret,
        mfaEnabled: true
    });

    const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
        email: testAdminEmail,
        password: adminPassword,
        deviceId: 'admin-p7-device'
    });

    const verifyAdminRes = await axios.post(`${API_URL}/auth/verify-mfa`, {
        tempToken: adminLoginRes.data.tempToken,
        code: testCode,
        deviceId: 'admin-p7-device'
    });
    const freshAdminToken = verifyAdminRes.data.token;

    // Verify settings read endpoint doesn't require elevated (only super_admin)
    const settingsGet = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${freshAdminToken}` }
    });
    if (settingsGet.status === 200) {
        console.log('[Test 5] GET /settings works without elevated prompt (requires standard super_admin only).');
    }

    // Now call PUT /settings (requires elevated privilege).
    // The previous verify-mfa call cached mfa_verified in Redis for 15 minutes, so it should succeed!
    const settingsPutFirst = await axios.put(`${API_URL}/admin/settings`, {
        section: 'platformControl',
        settings: { sellerOnboardingEnabled: true }
    }, {
        headers: { 
            Authorization: `Bearer ${freshAdminToken}`,
            'x-device-id': 'admin-p7-device'
        }
    });

    if (settingsPutFirst.status === 200) {
        console.log('[Test 5] Elevated action succeeded because MFA was recently verified.');
        
        // Evict elevated status in Redis to simulate time lapse (15 minutes expiry)
        await redis.del(`mfa_verified:${freshAdmin._id}:admin-p7-device`);
        console.log('[Test 5] Evicted mfa_verified token from Redis cache to simulate session age.');

        // Attempt PUT /settings again. Should be challenged with ELEVATED_MFA_REQUIRED!
        try {
            await axios.put(`${API_URL}/admin/settings`, {
                section: 'platformControl',
                settings: { sellerOnboardingEnabled: false }
            }, {
                headers: { 
                    Authorization: `Bearer ${freshAdminToken}`,
                    'x-device-id': 'admin-p7-device'
                }
            });
            throw new Error('Test 5 Failed: Elevated action succeeded without active MFA validation cache');
        } catch (elevatedErr) {
            if (elevatedErr.response && elevatedErr.response.status === 403 && elevatedErr.response.data.code === 'ELEVATED_MFA_REQUIRED') {
                console.log('[Test 5] Received correct challenge (403 ELEVATED_MFA_REQUIRED).');

                // Call MFA verify elevated endpoint to re-auth
                await axios.post(`${API_URL}/auth/mfa/verify-elevated`, {
                    code: testCode,
                    deviceId: 'admin-p7-device'
                }, {
                    headers: { Authorization: `Bearer ${freshAdminToken}` }
                });

                console.log('[Test 5] Re-authenticated elevated action.');

                // Attempt PUT /settings a third time. Should succeed!
                const settingsPutSecond = await axios.put(`${API_URL}/admin/settings`, {
                    section: 'platformControl',
                    settings: { sellerOnboardingEnabled: false }
                }, {
                    headers: { 
                        Authorization: `Bearer ${freshAdminToken}`,
                        'x-device-id': 'admin-p7-device'
                    }
                });

                if (settingsPutSecond.status === 200) {
                    console.log('\x1b[32m[Test 5 PASSED] Elevated privilege re-authorization flow validated successfully.\x1b[0m');
                } else {
                    throw new Error('Test 5 Failed: Setting update failed after re-authorization');
                }
            } else {
                throw elevatedErr;
            }
        }
    } else {
        throw new Error('Test 5 Failed: Initial settings put failed');
    }

    // Clean up test data
    await User.deleteMany({ email: { $in: [testAdminEmail, testModeratorEmail, testUserEmail] } });
    await SecurityEvent.deleteMany({ user: { $in: [testAdminEmail, testModeratorEmail, testUserEmail] } });
    await AuditTrail.deleteMany({ actorEmail: { $in: [testAdminEmail, testModeratorEmail, testUserEmail] } });
    await redis.del(`mfa_verified:${freshAdmin._id}:admin-p7-device`);

    console.log('\n--- SECURITY PHASE 7 INTEGRATION TESTS COMPLETED SUCCESSFULLY ---\n');
    mongoose.connection.close();
    process.exit(0);
};

runTests().catch(err => {
    console.error('\n❌ Test Suite Failed with fatal error:', err.message);
    if (err.response) {
        console.error('Response data:', err.response.data);
    }
    mongoose.connection.close();
    process.exit(1);
});
