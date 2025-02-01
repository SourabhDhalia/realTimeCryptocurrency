// routes/streamingRoutes.js
const express = require('express');
const router = express.Router();
const logger = require('../config/logger');

const { createBinanceWebSocket, flushAllCandles } = require('../services/binanceStream');

let ws;
let isStreaming = false;
let ioRef;

const { startStream, stopStream } = require('../controllers/streamingController');



module.exports = { router };  // ✅ Correct export
// 15+ symbols
const binanceSymbols = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
  'DOGEUSDT', 'SOLUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT',
  'SHIBUSDT', 'AVAXUSDT', 'TRXUSDT', 'UNIUSDT', 'LINKUSDT'
];
const streamEndpoints = binanceSymbols.map(s => s.toLowerCase() + '@trade').join('/');

// We'll set wsUrl in index.js using config
let wsUrl = '';

/** Set references from the outside: */
function setSocketIO(io) {
  ioRef = io;
}
function setWsUrl(url) {
  wsUrl = url;
}

/**
 * POST /stream/start
 */
router.post('/start', async (req, res, next) => {
  if (isStreaming) {
    return res.status(400).json({ message: 'Streaming already started.' });
  }
  try {
    ws = createBinanceWebSocket(wsUrl, (symbol, price, volume, tradeTimeMs) => {
      // emit to front-end
      if (ioRef) {
        ioRef.emit('cryptoData', {
          symbol, price, volume, timestamp: tradeTimeMs
        });
      }
    });
    isStreaming = true;
    logger.info('Streaming started.');
    return res.status(200).json({ message: 'Streaming started.' });
  } catch (err) {
    logger.error('Error starting streaming:', err);
    next(err);
  }
});

/**
 * POST /stream/stop
 */
router.post('/stop', async (req, res, next) => {
  if (!isStreaming) {
    return res.status(400).json({ message: 'Streaming not started.' });
  }
  try {
    isStreaming = false;
    if (ws) {
      ws.close();
      ws = null;
    }
    await flushAllCandles();
    logger.info('Streaming stopped.');
    return res.status(200).json({ message: 'Streaming stopped.' });
  } catch (err) {
    logger.error('Error stopping streaming:', err);
    next(err);
  }
});

module.exports = {
  router,
  setSocketIO,
  setWsUrl
};