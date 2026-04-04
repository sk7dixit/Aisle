const crypto = require('crypto');

// Encryption Settings
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-secret-key-32-chars-long-!!!';

/**
 * Encrypts text using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} - Encrypted text in format iv:ciphertext
 */
const encrypt = (text) => {
    if (!text) return null;

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        // Ensure key is 32 bytes for aes-256
        const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Encryption Error:', error);
        return null;
    }
};

/**
 * Decrypts text using AES-256-CBC
 * @param {string} text - The encrypted text in format iv:ciphertext
 * @returns {string} - Decrypted text
 */
const decrypt = (text) => {
    if (!text || !text.includes(':')) return null;

    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');

        const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error('Decryption Error:', error);
        return null;
    }
};

module.exports = { encrypt, decrypt };
