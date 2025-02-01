const express = require('express');
const { getCrypto, fetchBinance } = require('../controllers/cryptoController');

const router = express.Router();

router.get('/crypto', getCrypto);
router.get('/fetch-binance', fetchBinance);

module.exports = { router };  // ✅ Correct export