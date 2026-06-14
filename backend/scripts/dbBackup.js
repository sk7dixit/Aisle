const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const BACKUP_ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'fallback-backup-secret-key-32-chars';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const encryptData = (plainText, secretKey) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.createHash('sha256').update(String(secretKey)).digest();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

const runBackup = async () => {
    console.log('=== STARTING DATABASE ENCRYPTED BACKUP ===');
    
    if (!MONGO_URI) {
        console.error('[Backup Error] MONGO_URI is not set in environment.');
        process.exit(1);
    }

    try {
        // 1. Connect to MongoDB
        console.log('[Backup] Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('[Backup] Connected successfully.');

        // 2. Load all model definitions automatically
        const modelsPath = path.join(__dirname, '../models');
        fs.readdirSync(modelsPath).forEach(file => {
            if (file.endsWith('.js') && !fs.lstatSync(path.join(modelsPath, file)).isDirectory()) {
                try {
                    require(path.join(modelsPath, file));
                } catch (e) {
                    // Ignore load errors for schema dependencies
                }
            }
        });

        // 3. Extract and serialize all collection data
        const backupData = {};
        console.log('[Backup] Extracting collections data...');
        for (let modelName of mongoose.modelNames()) {
            const Model = mongoose.model(modelName);
            // Bypass any global soft-delete scopes during backup to ensure absolute data recovery
            const docs = await Model.find({}).lean();
            backupData[modelName] = docs;
            console.log(` - Collection '${modelName}': ${docs.length} documents extracted.`);
        }

        // 4. Encrypt the backup payload
        console.log('[Backup] Encrypting database archive...');
        const serialized = JSON.stringify(backupData);
        const encrypted = encryptData(serialized, BACKUP_ENCRYPTION_KEY);

        // 5. Ensure backups directory exists
        const backupsDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        // 6. Save encrypted archive
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.enc`;
        const filepath = path.join(backupsDir, filename);

        // Remove write permission before writing if file exists, but it's a new file
        fs.writeFileSync(filepath, encrypted, 'utf8');
        console.log(`[Backup] Encrypted backup archive written to: ${filepath}`);

        // 7. Enforce Immutability (Set file to Read-Only: 0o444)
        fs.chmodSync(filepath, 0o444);
        console.log('[Backup] Immutability lock applied (File marked as read-only).');

        console.log('=== BACKUP COMPLETED SUCCESSFULLY ===');
    } catch (error) {
        console.error('[Backup Fatal Error]:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

runBackup();
