
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { updateSellerStatus, blockUser, updateProductStatus } = require('../backend/controllers/adminController');
const User = require('../backend/models/User');
const Product = require('../backend/models/Product');
const AdminActionLog = require('../backend/models/AdminActionLog');

dotenv.config({ path: './backend/.env' });

const runTests = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Setup Test Data
        const testAdmin = await User.findOne({ role: 'admin' });
        if (!testAdmin) throw new Error("No Admin found for testing");

        const testUser = await User.findOne({ role: 'customer' }) || await User.create({
            name: 'Test Target', email: 'testtarget@example.com', password: 'pass', role: 'customer'
        });

        // Mock Req/Res
        const mockRes = () => {
            const res = {};
            res.status = (code) => {
                res.statusCode = code;
                return res;
            };
            res.json = (data) => {
                res.data = data;
                return res;
            };
            return res;
        };

        console.log('\n--- TEST 1: Idempotency (Block User) ---');
        // Ensure user is active first
        testUser.accountStatus = 'active';
        await testUser.save();

        // 1. Block (Should Success)
        let req1 = { user: testAdmin, ip: '127.0.0.1', body: { reason: 'Test Block' }, params: { id: testUser._id } };
        let res1 = mockRes();
        await blockUser(req1, res1);
        console.log(`Call 1 (Block): ${res1.statusCode || 200} - ${res1.data?.message}`);

        // 2. Block Again (Should Fail 400)
        let res2 = mockRes();
        await blockUser(req1, res2);
        console.log(`Call 2 (Block Again): ${res2.statusCode} - ${res2.data?.message}`);

        if (res2.statusCode === 400) console.log('✅ Idempotency Verified');
        else console.error('❌ Idempotency Failed');


        console.log('\n--- TEST 2: Suspicious Velocity ---');
        // Trigger 6 destructive actions rapidly
        for (let i = 0; i < 6; i++) {
            // Force reset via DB to avoid instance version conflicts
            await User.findByIdAndUpdate(testUser._id, { accountStatus: 'active' });

            let reqVel = { user: testAdmin, ip: '127.0.0.1', body: { reason: `Velocity Test ${i}` }, params: { id: testUser._id } };
            let resLoop = mockRes();
            await blockUser(reqVel, resLoop);
            process.stdout.write(` [${resLoop.statusCode}] `);
        }

        console.log('\nWaiting for async trigger...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const recentWarnings = await AdminActionLog.countDocuments({
            performedBy: testAdmin._id,
            severity: 'Warning',
            createdAt: { $gt: new Date(Date.now() - 60000) }
        });
        console.log(`Debug: Found ${recentWarnings} recent warnings.`);

        console.log('Checking Logs for SUSPICIOUS_VELOCITY...');

        const velocityLog = await AdminActionLog.findOne({
            actionType: 'SUSPICIOUS_VELOCITY',
            performedBy: testAdmin._id,
            createdAt: { $gt: new Date(Date.now() - 10000) }
        });

        if (velocityLog) {
            console.log('✅ Suspicious Velocity Logged: CRITICAL');
            console.log(`   Reason: ${velocityLog.reason}`);
        } else {
            console.error('❌ Suspicious Velocity NOT Logged');
        }

        console.log('\nTests Completed.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTests();
