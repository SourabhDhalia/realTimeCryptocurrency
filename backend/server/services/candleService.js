// services/candleService.js
const Candle = require('../models/Candle');
const logger = require('../config/logger');

/**
 * Insert multiple candle docs at once (e.g. for backfill).
 */
async function insertCandles(candleDocs) {
  try {
    await Candle.insertMany(candleDocs, { ordered: false });
  } catch (err) {
    // Ignore duplicate key errors
    if (err.code !== 11000) {
      logger.error('Error inserting candles:', err);
      throw err; // re-throw or handle gracefully
    }
  }
}

/**
 * Save a single candle (e.g. finalizing a partial candle).
 */
async function saveCandle(symbol, candleData) {
  const doc = new Candle({
    symbol,
    timestamp: candleData.startTime,
    open: candleData.open,
    high: candleData.high,
    low: candleData.low,
    close: candleData.close,
    volume: candleData.volume
  });
  try {
    await doc.save();
  } catch (err) {
    if (err.code !== 11000) {
      logger.error(`Error saving candle for ${symbol}:`, err);
      throw err;
    }
  }
}

/**
 * Find candles for last 7 days
 */
async function findCandlesLast7Days(symbol) {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  return Candle.find({
    symbol,
    timestamp: { $gte: sevenDaysAgo }
  }).sort({ timestamp: 1 });
}

module.exports = {
  insertCandles,
  saveCandle,
  findCandlesLast7Days
};