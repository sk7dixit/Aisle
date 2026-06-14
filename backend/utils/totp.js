const crypto = require('crypto');

/**
 * Custom Base32 decoding adhering to RFC 4648.
 * Maps character set A-Z, 2-7 to binary data.
 */
function base32Decode(str) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = str.replace(/[\s=]/g, '').toUpperCase();
    let bits = '';

    for (let i = 0; i < cleaned.length; i++) {
        const val = alphabet.indexOf(cleaned[i]);
        if (val === -1) {
            throw new Error(`Invalid Base32 character: ${cleaned[i]}`);
        }
        bits += val.toString(2).padStart(5, '0');
    }

    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return Buffer.from(bytes);
}

/**
 * Custom Base32 encoding adhering to RFC 4648.
 * Maps binary buffer to A-Z, 2-7 characters.
 */
function base32Encode(buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';

    for (let i = 0; i < buffer.length; i++) {
        bits += buffer[i].toString(2).padStart(8, '0');
    }

    let encoded = '';
    for (let i = 0; i < bits.length; i += 5) {
        const chunk = bits.substring(i, i + 5);
        if (chunk.length < 5) {
            encoded += alphabet[parseInt(chunk.padEnd(5, '0'), 2)];
        } else {
            encoded += alphabet[parseInt(chunk, 2)];
        }
    }
    return encoded;
}

/**
 * Generates a random Base32 TOTP secret key and corresponding provisioning URL.
 * @param {string} email User email for label context.
 * @param {string} issuer Branding context.
 */
function generateSecret(email = 'admin@aisle.in', issuer = 'Aisle') {
    // 10 bytes = 80 bits of entropy (standard for Google Authenticator TOTP)
    const bytes = crypto.randomBytes(10);
    const secret = base32Encode(bytes);
    
    // Create standard provisioning URL (otpauth scheme)
    const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(email)}`;
    const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    
    return { secret, otpauthUrl };
}

/**
 * Verifies a 6-digit TOTP token code against a Base32 secret key.
 * Supports timing drift search window (e.g. window = 1 allows -30s to +30s).
 * @param {string} secret Base32 encoded secret.
 * @param {string} token 6-digit verification code.
 * @param {number} window Timing window (multiples of 30 seconds).
 */
function verifyToken(secret, token, window = 1) {
    try {
        if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
            return false;
        }

        const decodedSecret = base32Decode(secret);
        // Step counter representing 30 second blocks
        const T = Math.floor(Date.now() / 1000 / 30);

        for (let i = -window; i <= window; i++) {
            const step = T + i;
            
            // Build 8-byte big-endian counter buffer
            const counterBuf = Buffer.alloc(8);
            counterBuf.writeUInt32BE(0, 0); // High 32-bits (unused)
            counterBuf.writeUInt32BE(step, 4); // Low 32-bits (time step)

            // Compute HMAC-SHA1
            const hmac = crypto.createHmac('sha1', decodedSecret);
            hmac.update(counterBuf);
            const digest = hmac.digest();

            // Extract 4 bytes using dynamic offset (offset is last 4 bits of digest)
            const offset = digest[digest.length - 1] & 0xf;
            const code = ((digest[offset] & 0x7f) << 24) |
                         (digest[offset + 1] << 16) |
                         (digest[offset + 2] << 8) |
                         digest[offset + 3];

            // Direct 6-digit mod and zero-padding
            const calculatedToken = (code % 1000000).toString().padStart(6, '0');
            if (calculatedToken === token) {
                return true;
            }
        }
        return false;
    } catch (err) {
        console.error('[TOTP] Token verification error:', err.message);
        return false;
    }
}

module.exports = {
    base32Decode,
    base32Encode,
    generateSecret,
    verifyToken
};
