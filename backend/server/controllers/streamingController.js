const { startStreaming, stopStreaming } = require('../services/binanceStream');
const logger = require('../config/logger');

/**
 * POST /start
 */
async function startStream(req, res, next) {
  try {
    startStreaming();
    logger.info('Streaming started.');
    res.json({ message: 'Streaming started.' });
  } catch (err) {
    logger.error('Error starting streaming:', err);
    next(err);
  }
}

/**
 * POST /stop
 */
async function stopStream(req, res, next) {
  try {
    stopStreaming();
    logger.info('Streaming stopped.');
    res.json({ message: 'Streaming stopped.' });
  } catch (err) {
    logger.error('Error stopping streaming:', err);
    next(err);
  }
}

module.exports = { startStream, stopStream };