require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const candleRoutes = require('./routes/candleRoutes');
const streamingRoutes = require('./routes/streamingRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(rateLimit);

// Routes
app.use('/api', candleRoutes);
app.use('/stream', streamingRoutes);

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error('Error connecting to MongoDB:', err));

const server = app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
const io = new Server(server, { cors: { origin: '*' } });

module.exports = { io };
