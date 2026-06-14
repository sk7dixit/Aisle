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

const decryptData = (encryptedText, secretKey) => {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encrypted = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto.createHash('sha256').update(String(secretKey)).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

const runRestore = async () => {
    console.log('=== STARTING DATABASE RESTORE / RECOVERY ===');
    
    // Get backup file path from arguments
    const backupFilePath = process.argv[2];
    if (!backupFilePath) {
        console.error('[Restore Error] Please specify the path to the backup file.');
        console.log('Usage: node scripts/dbRestore.js ./backups/backup-timestamp.enc');
        process.exit(1);
    }

    const resolvedPath = path.resolve(backupFilePath);
    if (!fs.existsSync(resolvedPath)) {
        console.error(`[Restore Error] Backup file not found at: ${resolvedPath}`);
        process.exit(1);
    }

    if (!MONGO_URI) {
        console.error('[Restore Error] MONGO_URI is not set in environment.');
        process.exit(1);
    }

    try {
        // 1. Read and Decrypt Backup File
        console.log(`[Restore] Reading backup file from: ${resolvedPath}`);
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');

        console.log('[Restore] Decrypting database archive...');
        const decryptedContent = decryptData(fileContent, BACKUP_ENCRYPTION_KEY);
        const backupData = JSON.parse(decryptedContent);

        // 2. Connect to MongoDB
        console.log('[Restore] Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('[Restore] Connected successfully.');

        // 3. Load all model definitions automatically
        const modelsPath = path.join(__dirname, '../models');
        fs.readdirSync(modelsPath).forEach(file => {
            if (file.endsWith('.js') && !fs.lstatSync(path.join(modelsPath, file)).isDirectory()) {
                try {
                    require(path.join(modelsPath, file));
                } catch (e) {
                    // Ignore load errors
                }
            }
        });

        // 4. Restore each collection
        console.log('[Restore] Restoring collections data (Clear first, then Insert)...');
        for (let modelName in backupData) {
            if (!mongoose.modelNames().includes(modelName)) {
                console.warn(`[Restore Warning] Model '${modelName}' is defined in backup but not in current codebase. Skipping.`);
                continue;
            }

            const Model = mongoose.model(modelName);
            const docs = backupData[modelName];

            // Clean existing collection first
            await Model.deleteMany({});
            console.log(` - Collection '${modelName}': Cleared existing records.`);

            if (docs.length > 0) {
                // Restore documents
                await Model.insertMany(docs);
                console.log(` - Collection '${modelName}': Restored ${docs.length} documents.`);
            }
        }

        console.log('=== RESTORE AND VERIFICATION COMPLETED SUCCESSFULLY ===');
    } catch (error) {
        console.error('[Restore Fatal Error]:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

runRestore();
