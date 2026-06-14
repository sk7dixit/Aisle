const crypto = require('crypto');

// Encryption Settings
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16
const DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-secret-key-32-chars-long-!!!';

/**
 * Encrypts text using AES-256-CBC with a random IV (Non-deterministic)
 * @param {string} text - The text to encrypt
 * @returns {string} - Encrypted text in format iv:ciphertext
 */
const encrypt = (text) => {
    if (!text) return null;

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        // Ensure key is 32 bytes for aes-256
        const key = crypto.createHash('sha256').update(String(DATA_ENCRYPTION_KEY)).digest();

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
 * Encrypts text using AES-256-CBC with a deterministic IV derived from the input (Deterministic)
 * @param {string} text - The text to encrypt
 * @returns {string} - Encrypted text in format iv:ciphertext
 */
const encryptDeterministic = (text) => {
    if (!text) return null;

    try {
        // MD5 of text gives a deterministic 16-byte value suitable for IV
        const iv = crypto.createHash('md5').update(String(text)).digest();
        // Ensure key is 32 bytes for aes-256
        const key = crypto.createHash('sha256').update(String(DATA_ENCRYPTION_KEY)).digest();

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(String(text));
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Deterministic Encryption Error:', error);
        return null;
    }
};

/**
 * Decrypts text using AES-256-CBC
 * @param {string} text - The encrypted text in format iv:ciphertext
 * @returns {string} - Decrypted text or original input if decryption fails
 */
const decrypt = (text) => {
    if (!text || typeof text !== 'string' || !text.includes(':')) return text;

    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');

        // Check if length is correct for IV and hex ciphertext
        if (iv.length !== IV_LENGTH || encryptedText.length === 0) {
            return text; // Return as is if format matches regex but is invalid hex
        }

        const key = crypto.createHash('sha256').update(String(DATA_ENCRYPTION_KEY)).digest();

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        // Fallback: If decryption fails (e.g. key mismatch or legacy unencrypted data),
        // return the original text directly rather than throwing/crashing.
        return text;
    }
};

module.exports = { encrypt, encryptDeterministic, decrypt };
