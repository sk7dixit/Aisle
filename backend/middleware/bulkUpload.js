const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/bulk directory exists
const uploadDir = path.join(__dirname, '../uploads/bulk');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (Excel & CSV only)
const fileFilter = (req, file, cb) => {
    const filetypes = /xlsx|csv|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    // Some systems report different mimetypes for Excel/CSV
    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed!'));
    }
};

const bulkUpload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

module.exports = bulkUpload;
