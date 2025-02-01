const Crypto = require('../models/Crypto');
const { fetchBinanceData } = require('../services/binanceService');
const logger = require('../config/logger');

/**
 * GET /crypto
 */
async function getCrypto(req, res, next) {
  try {
    const data = await Crypto.find().sort({ timestamp: -1 }).limit(12);
    res.json(data);
  } catch (err) {
    logger.error('Error fetching crypto data:', err);
    next(err);
  }
}

/**
 * GET /fetch-binance
 */
async function fetchBinance(req, res, next) {
  try {
    await fetchBinanceData();
    res.json({ message: 'Data fetched successfully' });
  } catch (err) {
    logger.error('Error fetching Binance data:', err);
    next(err);
  }
}

module.exports = { getCrypto, fetchBinance };