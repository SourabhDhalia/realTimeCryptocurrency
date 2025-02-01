const mongoose = require('mongoose');

const candleSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true
  },
  timestamp: {
    type: new Date(c.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    required: true
  },
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number
});

// Combination of symbol + timestamp should be unique
candleSchema.index({ symbol: 1, timestamp: 1 }, { unique: true });

module.exports = mongoose.model('Candle', candleSchema);