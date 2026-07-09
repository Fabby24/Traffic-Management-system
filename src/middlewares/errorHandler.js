const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Default error
    let statusCode = err.status || 500;
    let message = err.message || 'Something went wrong. Please try again later.';
    let errors = null;

    // Handle Prisma errors
    if (err.code) {
        switch (err.code) {
            case 'P2000':
                statusCode = 400;
                message = 'The provided value is too long';
                break;
            case 'P2001':
                statusCode = 404;
                message = 'Record not found';
                break;
            case 'P2002':
                statusCode = 409;
                message = 'Duplicate entry detected';
                break;
            case 'P2025':
                statusCode = 404;
                message = 'Record not found';
                break;
            case 'P2034':
                statusCode = 409;
                message = 'Concurrent operation conflict';
                break;
            default:
                // Unknown Prisma error
                if (process.env.NODE_ENV === 'development') {
                    message = err.message;
                }
                break;
        }
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Handle validation errors
    if (err.name === 'ValidationError' || err.isJoi) {
        statusCode = 400;
        message = 'Validation failed';
        errors = err.details || err.errors;
    }

    // Handle multer errors
    if (err.name === 'MulterError') {
        statusCode = 400;
        message = err.message;
    }

    // Response
    res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            code: err.code
        })
    });
};

module.exports = errorHandler;