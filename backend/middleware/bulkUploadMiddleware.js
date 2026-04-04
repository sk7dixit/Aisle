const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.mimetype === "text/csv" ||
        file.originalname.match(/\.(xlsx|csv)$/)
    ) {
        cb(null, true);
    } else {
        cb(new Error("Error: Only Excel (.xlsx) and CSV (.csv) files are allowed!"), false);
    }
};

const upload = multer({
    storage,
    fileFilter
});

module.exports = upload;
