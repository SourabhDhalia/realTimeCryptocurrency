// ChartPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// 1) Import Chart.js modules
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// 2) Register them globally once
ChartJS.register(
  CategoryScale,  // x-axis scale
  LinearScale,    // y-axis scale (the "linear" one)
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function ChartPage() {
  const { symbol } = useParams();  // e.g. BTCUSDT
  const [candleData, setCandleData] = useState([]);

  useEffect(() => {
    // Fetch last 7 days of 1-minute candles for this symbol
    axios.get(`http://localhost:4000/api/last15days/${symbol}`)
      .then((res) => setCandleData(res.data))
      .catch((err) => console.error('Error fetching candle data:', err));
  }, [symbol]);

  // Prepare chart data
  const data = {
    labels: candleData.map(c =>
      new Date(c.timestamp).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
      })
    ),
    datasets: [
      {
        label: `${symbol} Close`,
        data: candleData.map(c => c.close),
        borderColor: 'rgba(75,192,192,1)',
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  return (
    <div style={{ width: '80%', margin: '0 auto', padding: '1rem' }}>
      <h2>{symbol} - Last 15 Days</h2>
      <Line data={data} options={options} />
    </div>
  );
}

export default ChartPage;