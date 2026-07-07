const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

//routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');

//middleware
const {errorHandler, notFoundHandler} = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use("/api", limiter);

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientRoutes);

app.get('/health', (req, res) => {
    res.json({status: 'ok', message: 'Server is healthy'});
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;