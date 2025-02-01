// models/Crypto.js
const mongoose = require('mongoose');

const cryptoSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ltp: Number,
  symbol: String
});

module.exports = mongoose.model('Crypto', cryptoSchema);