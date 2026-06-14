const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const text = 'shoplens017@gmail.com';

const testKey = (keyName, keyValue) => {
    try {
        const iv = crypto.createHash('md5').update(String(text)).digest();
        const key = crypto.createHash('sha256').update(String(keyValue)).digest();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(String(text));
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const result = iv.toString('hex') + ':' + encrypted.toString('hex');
        console.log(`${keyName}: ${result}`);
    } catch (err) {
        console.error(`Error with key ${keyName}:`, err.message);
    }
};

console.log('Values in process.env:');
console.log('DATA_ENCRYPTION_KEY:', process.env.DATA_ENCRYPTION_KEY);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

testKey('Env DATA_ENCRYPTION_KEY', process.env.DATA_ENCRYPTION_KEY);
testKey('Env JWT_SECRET', process.env.JWT_SECRET);
testKey('Fallback key', 'fallback-secret-key-32-chars-long-!!!');
