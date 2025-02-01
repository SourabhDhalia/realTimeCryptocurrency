const WebSocket = require('ws');
const logger = require('../config/logger');

const binanceSymbols = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
  'DOGEUSDT', 'SOLUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT',
  'SHIBUSDT', 'AVAXUSDT', 'TRXUSDT', 'UNIUSDT', 'LINKUSDT'
];

const streamEndpoints = binanceSymbols
  .map(symbol => symbol.toLowerCase() + '@trade')
  .join('/');
const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streamEndpoints}`;

let ws;
let isStreaming = false;

function startStreaming(io) {
  if (isStreaming) {
    logger.info('Streaming is already running.');
    return;
  }

  try {
    isStreaming = true;
    ws = new WebSocket(wsUrl);

    ws.on('open', () => logger.info('WebSocket connection established with Binance.'));
    
    ws.on('message', (rawData) => {
      try {
        const json = JSON.parse(rawData);
        const trade = json.data;
        if (!trade) return;

        const { s: symbol, p: ltp } = trade;
        const numericPrice = parseFloat(ltp);

        io.emit('cryptoData', { timestamp: new Date(), ltp: numericPrice, symbol });
      } catch (err) {
        logger.error('Error processing WebSocket message:', err);
      }
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error:', err);
      isStreaming = false;
    });

    ws.on('close', () => {
      logger.info('WebSocket connection closed.');
      isStreaming = false;
    });

  } catch (err) {
    logger.error('Error starting streaming:', err);
    isStreaming = false;
  }
}

function stopStreaming() {
  if (!isStreaming) {
    logger.info('Streaming is already stopped.');
    return;
  }

  try {
    isStreaming = false;
    if (ws) ws.close();
    logger.info('Streaming stopped.');
  } catch (err) {
    logger.error('Error stopping streaming:', err);
  }
}

module.exports = { startStreaming, stopStreaming };