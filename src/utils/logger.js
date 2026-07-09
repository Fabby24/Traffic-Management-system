const winston = require('winston');
const path = require('path');

const logDir = process.env.LOG_DIR || 'logs';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // File transports
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            format: logFormat
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            format: logFormat
        })
    ],
    exitOnError: false
});

// Stream for morgan integration
logger.stream = {
    write: (message) => logger.info(message.trim())
};

module.exports = logger;