// src/components/ChartPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { fetchCandleData } from '../api';

// Chart.js Configuration
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function ChartPage() {
  const { symbol } = useParams();
  const [candleData, setCandleData] = useState([]);

  useEffect(() => {
    fetchCandleData(symbol).then(setCandleData);
  }, [symbol]);

  const data = {
    labels: candleData.map(c => new Date(c.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })),
    datasets: [{
      label: `${symbol} Close Price`,
      data: candleData.map(c => c.close),
      borderColor: 'rgba(75,192,192,1)',
      fill: false
    }]
  };

  const options = {
    responsive: true,
    scales: { y: { beginAtZero: false } }
  };

  return (
    <div style={{ width: '80%', margin: '0 auto', padding: '1rem' }}>
      <h2>{symbol} - Last 7 Days</h2>
      <Line data={data} options={options} />
    </div>
  );
}

export default ChartPage;