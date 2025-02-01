// models/Candle.js
const mongoose = require('mongoose');

const candleSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  timestamp: { type: Date, required: true }, // the start of the minute
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number
});

// Make (symbol, timestamp) unique, so no duplicates
candleSchema.index({ symbol: 1, timestamp: 1 }, { unique: true });

module.exports = mongoose.model('Candle', candleSchema);