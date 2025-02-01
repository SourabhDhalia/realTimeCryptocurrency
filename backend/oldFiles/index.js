/////////////////////////////
// 1. Imports & Setup
/////////////////////////////
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const { WebSocket } = require('ws');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

// Server port
const PORT = 4000;

/////////////////////////////
// 2. Connect to MongoDB
/////////////////////////////
mongoose.connect('mongodb://localhost:27017/crypto', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

/////////////////////////////
// 3. Define Mongoose Models
/////////////////////////////
const candleSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  timestamp: { type: Date, required: true }, // start of the minute
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number
});
candleSchema.index({ symbol: 1, timestamp: 1 }, { unique: true });

const Candle = mongoose.model('Candle', candleSchema);

/////////////////////////////
// 4. Global Variables
/////////////////////////////
let ws;                // WebSocket instance
let isStreaming = false;  
let currentCandles = {};     // For 1-minute aggregation
let latestPrices = {};       // For real-time table (symbol => {price, volume, timestamp})

// 15+ symbols
const binanceSymbols = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
  'DOGEUSDT', 'SOLUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT',
  'SHIBUSDT', 'AVAXUSDT', 'TRXUSDT', 'UNIUSDT', 'LINKUSDT'
];

// Combined stream URL
const streamEndpoints = binanceSymbols.map(s => s.toLowerCase() + '@trade').join('/');
const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streamEndpoints}`;

/////////////////////////////
// 5. Candle Aggregation Helpers
/////////////////////////////
function getMinuteDate(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}

// Save the in-memory candle to DB
async function flushCandleToDB(symbol, candle) {
  const doc = new Candle({
    symbol: symbol,
    timestamp: candle.startTime,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume
  });
  try {
    await doc.save();
  } catch (err) {
    if (err.code !== 11000) {  // ignore duplicate key error
      console.error('Error saving candle:', err);
    }
  }
}

// On each trade
async function processTrade(symbol, price, volume, tradeTime) {
  // 1) Update latestPrices (for real-time table)
  latestPrices[symbol] = {
    symbol,
    price,
    volume,
    timestamp: tradeTime,  // keep as ms
  };

  // 2) Handle 1-minute aggregator
  const minute = getMinuteDate(new Date(tradeTime)); 
  const existing = currentCandles[symbol];

  if (!existing || existing.startTime.getTime() !== minute.getTime()) {
    // flush old candle if it exists
    if (existing) {
      await flushCandleToDB(symbol, existing);
    }
    // create new candle
    currentCandles[symbol] = {
      open: price,
      high: price,
      low: price,
      close: price,
      volume: volume,
      startTime: minute
    };
  } else {
    existing.high = Math.max(existing.high, price);
    existing.low = Math.min(existing.low, price);
    existing.close = price;
    existing.volume += volume;
  }
}

// Flush all in-memory candles (when stopping)
async function flushAllCandles() {
  for (const symbol of Object.keys(currentCandles)) {
    await flushCandleToDB(symbol, currentCandles[symbol]);
  }
  currentCandles = {};
}

/////////////////////////////
// 6. Gap Filling (Optional)
/////////////////////////////
// ... same as before if you want to fill data from the last stop

/////////////////////////////
// 7. Socket.io server
/////////////////////////////
const server = app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
const io = new Server(server, {
  cors: { origin: '*' }
});

/////////////////////////////
// 8. Start Streaming (POST /start)
/////////////////////////////
app.post('/start', async (req, res) => {
  if (isStreaming) {
    return res.status(400).json({ message: 'Streaming already started.' });
  }
  try {
    // Optionally: await fillDataGaps(); if you want to fill from last time
    ws = new WebSocket(wsUrl);
    isStreaming = true;

    ws.on('message', async (rawData) => {
      try {
        const json = JSON.parse(rawData);
        const trade = json.data;
        if (!trade) return;

        const symbol = trade.s;  // e.g. BTCUSDT
        const price = parseFloat(trade.p);
        // 'q' might be base quantity or quote volume, check Binance docs
        const volume = parseFloat(trade.q);
      //  const tradeTime = trade.T; // ms
// raw trade timestamp
const rawTimestamp = trade.T;

// Convert to ms if needed:
const tradeTimeMs = rawTimestamp.toString().length === 10
  ? rawTimestamp * 1000
  : rawTimestamp;

// Then emit it
io.emit('cryptoData', {
  symbol,
  price,
  volume,
  timestamp: tradeTimeMs
});
      } catch (err) {
        console.error('Error in ws message:', err);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      isStreaming = false;
    });

    ws.on('close', () => {
      console.log('WebSocket closed');
      isStreaming = false;
    });

    return res.status(200).json({ message: 'Streaming started.' });
  } catch (err) {
    console.error('Error starting streaming:', err);
    return res.status(500).json({ message: 'Error starting streaming.' });
  }
});

/////////////////////////////
// 9. Stop Streaming (POST /stop)
/////////////////////////////
app.post('/stop', async (req, res) => {
  if (!isStreaming) {
    return res.status(400).json({ message: 'Streaming not started.' });
  }
  try {
    // set flag and close the WS
    isStreaming = false;
    if (ws) ws.close();

    // flush in-memory candles
    await flushAllCandles();

    return res.status(200).json({ message: 'Streaming stopped.' });
  } catch (err) {
    console.error('Error stopping streaming:', err);
    return res.status(500).json({ message: 'Error stopping streaming.' });
  }
});

/////////////////////////////
// 10. Last 7 days Candle Data (GET /api/last7days/:symbol)
/////////////////////////////

async function backfill(symbol, startTimeMs, endTimeMs) {
  // 1) You can fetch up to 1000 candles in one call. If 15 days = 21600 minutes, 
  // you'll need multiple calls if limit=1000.
  let current = startTimeMs;
  while (current < endTimeMs) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&startTime=${current}&endTime=${endTimeMs}&limit=1000`;
    const response = await axios.get(url);
    const klines = response.data;

    if (!klines.length) break; // no more data

    const candleDocs = klines.map(k => {
      return {
        symbol,
        timestamp: new Date(k[0]), // openTime
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      };
    });

    // Insert many
    await Candle.insertMany(candleDocs, { ordered: false }).catch(err => {
      // ignore duplicate key errors
      if (err.code !== 11000) console.error('Error inserting klines:', err);
    });

    // The last returned kline's openTime
    const lastOpenTime = klines[klines.length - 1][0];
    current = lastOpenTime + (1000 * 60); // next minute
    if (current >= endTimeMs) break;
  }
}
// Example: GET /api/last15days/:symbol
// Pseudocode for a GET /api/last15days/:symbol
app.get('/api/last15days/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const now = Date.now();
  const fifteenDaysAgo = now - (15 * 24 * 60 * 60 * 1000);

  // 1) See if we have data for that 15-day window
  const earliestInDB = await Candle.findOne({ symbol, timestamp: { $gte: new Date(fifteenDaysAgo) } })
    .sort({ timestamp: 1 });

  // 2) If earliestInDB is missing or if the earliest record is, say, only from 2 days ago, do a backfill
  if (!earliestInDB) {
    // We have 0 data in last 15 days, so fetch entire 15 days from Binance
    await backfill(symbol, fifteenDaysAgo, now);
  } else {
    // Check if earliestInDB.timestamp is significantly after the 15-day-ago mark
    // If difference is e.g. 13 days, means we only have 2 days, so fetch missing range
    const earliestTime = earliestInDB.timestamp.getTime();
    if (earliestTime > fifteenDaysAgo + 24 * 60 * 60 * 1000) {
      // e.g. we are missing a big chunk
      await backfill(symbol, fifteenDaysAgo, earliestTime);
    }
  }

  // 3) After backfilling, query again
  const candles = await Candle.find({
    symbol,
    timestamp: { $gte: new Date(fifteenDaysAgo) }
  }).sort({ timestamp: 1 });

  return res.json(candles);
});


/*
only from our database data
// Example: GET /api/last15days/:symbol
app.get('/api/last15days/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const now = Date.now();
    const fifteenDaysAgo = new Date(now - 15 * 24 * 60 * 60 * 1000);

    const candles = await Candle.find({
      symbol,
      timestamp: { $gte: fifteenDaysAgo }
    }).sort({ timestamp: 1 });

    // If the DB is new or there's only 2 days of data, you'll get partial data
    return res.json(candles);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching data' });
  }
});
*/