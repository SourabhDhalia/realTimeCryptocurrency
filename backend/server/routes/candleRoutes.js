const express = require('express');
const candleController = require('../controllers/candleController'); // ✅ Correct import

const router = express.Router();

router.get('/last15', candleController.getLast15);
router.get('/averages', candleController.getAverages);
router.get('/last7days/:symbol', candleController.getLast7Days);

module.exports = { router };