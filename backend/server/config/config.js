// config/config.js
require('dotenv').config(); // load .env

module.exports = {
  port: process.env.PORT || 4000,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/crypto',
  binanceWsBase: process.env.BINANCE_WS_ENDPOINT || 'wss://stream.binance.com:9443',
  binanceRestUrl: process.env.BINANCE_REST_URL || 'https://api.binance.com/api/v3',
  binanceApiKey: process.env.BINANCE_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development'
};