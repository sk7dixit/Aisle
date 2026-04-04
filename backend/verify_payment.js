const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SellerAccountDetails = require('./models/SellerAccountDetails');
const { encrypt, decrypt } = require('./utils/encryption');

dotenv.config(); // Loads .env from current dir (backend/.env)

const verifyPaymentLogic = async () => {
    try {
        await require('./config/db')();
        console.log('Connected to DB');

        const testSellerId = new mongoose.Types.ObjectId();
        const rawUpiId = 'shashwat@upi';

        console.log('\n--- Test 1: Model Encryption ---');
        const settings = await SellerAccountDetails.create({
            sellerId: testSellerId,
            acceptsOnlinePayment: true,
            upiId: rawUpiId,
            paymentDisplayName: 'Test Shop',
            paymentSetupCompleted: true
        });

        console.log('Saved Record (raw field in obj):', settings.upiId);
        console.log('Masked UPI (virtual):', settings.maskedUpiId);

        // Manual DB check (bypass mongoose encryption logic if any)
        const doc = await mongoose.connection.db.collection('selleraccountdetails').findOne({ sellerId: testSellerId });
        console.log('DB Raw Data:', doc.upiId);

        if (doc.upiId.includes(':') && !doc.upiId.includes('@')) {
            console.log('SUCCESS: Data is encrypted in DB (format iv:ciphertext)');
        } else {
            console.log('FAILURE: Data remains in plain text in DB');
        }

        console.log('\n--- Test 2: Decryption ---');
        const decrypted = decrypt(doc.upiId);
        console.log('Decrypted UPI:', decrypted);
        if (decrypted === rawUpiId) {
            console.log('SUCCESS: Decryption matches original');
        } else {
            console.log('FAILURE: Decryption failed');
        }

        console.log('\n--- Test 3: Masking logic ---');
        console.log('shashwat@upi ->', settings.maskedUpiId);
        if (settings.maskedUpiId === 'sh***@upi') {
            console.log('SUCCESS: Masking correct');
        } else {
            console.log('FAILURE: Masking logic unexpected');
        }

        // Cleanup
        await SellerAccountDetails.deleteOne({ sellerId: testSellerId });
        console.log('\nCleanup done.');
        process.exit(0);

    } catch (error) {
        console.error('Verification Error:', error);
        process.exit(1);
    }
};

verifyPaymentLogic();
