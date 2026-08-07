const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import middleware
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFound');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./modules/auth/routes/authRoutes');
const dashboardRoutes = require('./modules/dashboard/routes/dashboardRoutes');
const userRoutes = require('./modules/users/routes/userRoutes');
const clientRoutes = require('./modules/clients/routes/clientRoutes');
const projectRoutes = require('./modules/projects/routes/projectRoutes');
const taskRoutes = require('./modules/tasks/routes/taskRoutes');
const notificationRoutes = require('./modules/notifications/routes/notificationRoutes');
const organizationRoutes = require('./modules/organization/routes/organizationRoutes');
const reportRoutes = require('./modules/reports/routes/reportRoutes');
const timeLogRoutes = require('./modules/time-logs/routes/timeLogRoutes');


const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(compression());


// General API limiter — generous, since dashboards fire many simultaneous reads
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
});

// Strict limiter for auth endpoints — login/register/password-reset abuse prevention
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later.',
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/dashboard', generalLimiter, dashboardRoutes);
app.use('/api/v1/users', generalLimiter, userRoutes);
app.use('/api/v1/clients', generalLimiter, clientRoutes);
app.use('/api/v1/projects', generalLimiter, projectRoutes);
app.use('/api/v1/tasks', generalLimiter, taskRoutes);
app.use('/api/v1/notifications', generalLimiter, notificationRoutes);
app.use('/api/v1/organizations', generalLimiter, organizationRoutes);
app.use('/api/v1/reports', generalLimiter, reportRoutes);
app.use('/api/v1/time-logs', generalLimiter, timeLogRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;