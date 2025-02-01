const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const { port, mongoURI } = require('./config/config');
const logger = require('./config/logger');

// ✅ Corrected Imports
const streamingRoutes = require('./routes/streamingRoutes').router;
const cryptoRoutes = require('./routes/cryptoRoutes').router;
const candleRoutes = require('./routes/candleRoutes').router;

mongoose.connect(mongoURI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => {
    logger.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

// ✅ Using the routes correctly
app.use('/stream', streamingRoutes);
app.use('/crypto', cryptoRoutes);
app.use('/api', candleRoutes);

const server = app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

// ✅ Socket.io setup
const io = new Server(server, {
  cors: { origin: '*' }
});
app.locals.io = io;