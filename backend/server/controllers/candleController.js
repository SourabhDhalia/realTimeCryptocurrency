const { getLast15ForAllSymbols, getAveragesForAllSymbols } = require('../services/candleService');
const logger = require('../config/logger');

/**
 * GET /api/last15
 */
async function getLast15(req, res, next) {
  try {
    const symbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
      'DOGEUSDT', 'SOLUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT',
      'SHIBUSDT', 'AVAXUSDT', 'TRXUSDT', 'UNIUSDT', 'LINKUSDT'
    ];
    const results = await getLast15ForAllSymbols(symbols);
    return res.json(results);
  } catch (err) {
    logger.error('Error fetching last 15 data:', err);
    next(err);
  }
}

/**
 * GET /api/averages
 */
async function getAverages(req, res, next) {
  try {
    const symbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
      'DOGEUSDT', 'SOLUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT',
      'SHIBUSDT', 'AVAXUSDT', 'TRXUSDT', 'UNIUSDT', 'LINKUSDT'
    ];
    const stats = await getAveragesForAllSymbols(symbols);
    return res.json(stats);
  } catch (err) {
    logger.error('Error computing averages:', err);
    next(err);
  }
}

/**
 * GET /api/last7days/:symbol
 */
async function getLast7Days(req, res, next) {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const candles = await Candle.find({
      symbol,
      timestamp: { $gte: sevenDaysAgo }
    }).sort({ timestamp: 1 });

    res.json(candles);
  } catch (err) {
    logger.error('Error fetching last 7 days:', err);
    next(err);
  }
}

// ✅ Ensure all functions are properly exported
module.exports = {
  getLast15,
  getAverages,
  getLast7Days
};