const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

const logDirectory = path.join(__dirname, '..', 'logs');

// Create the log directory if it does not exist
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Custom format for clean console and file output
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
);

// Create the Winston logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'aisle-backend' },
    transports: [
        // Daily rotating file for error logs
        new DailyRotateFile({
            filename: path.join(logDirectory, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '90d',
            level: 'error',
        }),
        // Daily rotating file for all logs combined
        new DailyRotateFile({
            filename: path.join(logDirectory, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '90d',
        }),
    ],
});

// Always write to console in development, or if explicitly enabled
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONSOLE_LOGS === 'true') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
    }));
}

// Create a dedicated security logger instance or transport
const securityLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'aisle-security' },
    transports: [
        new DailyRotateFile({
            filename: path.join(logDirectory, 'security-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '365d', // Keep security logs for 1 year
        }),
    ],
});

if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONSOLE_LOGS === 'true') {
    securityLogger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return `[SEC-AUDIT] [${timestamp}] ${message} ${JSON.stringify(meta)}`;
            })
        ),
    }));
}

// Expose helper methods
logger.security = (message, meta = {}) => {
    securityLogger.info(message, meta);
};

module.exports = logger;
