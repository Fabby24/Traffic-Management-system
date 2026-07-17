const dotenv = require('dotenv');
dotenv.config();
BigInt.prototype.toJSON = function() { return Number(this) }
const app = require('./src/app');
const logger = require('./src/utils/logger');
const { prisma } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info(' Database connected successfully');

        // Start server
        app.listen(PORT, () => {
            logger.info(` Server running on port ${PORT}`);
            logger.info(` http://localhost:${PORT}`);
        });

    } catch (error) {
        logger.error(' Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received. Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT signal received. Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

startServer();