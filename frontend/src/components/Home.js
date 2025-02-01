// src/components/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { Button } from '@mui/material';
import socket from '../socket';
import { fetchCryptoData, startStreaming, stopStreaming } from '../api';
import moment from "moment-timezone";

function Home() {
  const [data, setData] = useState([]);  // Stores real-time data
  const [isStreaming, setIsStreaming] = useState(false);
  const navigate = useNavigate();

  // Fetch initial data from the server
  useEffect(() => {
    fetchCryptoData().then(setData);
  }, []);

  // WebSocket listener for real-time updates
  useEffect(() => {
    socket.connect();
    socket.on('cryptoData', (newData) => {
      setData((prevData) => {
        const updatedData = prevData.filter(item => item.symbol !== newData.symbol);
        return [...updatedData, newData];
      });
    });

    return () => {
      socket.off('cryptoData');
      socket.disconnect();
    };
  }, []);

  // Handles navigation to the chart page
  const handleSymbolClick = (symbol) => navigate(`/chart/${symbol}`);

  // Data table columns
  const columns = [
    { field: 'symbol', headerName: 'Symbol', width: 130, renderCell: (params) => (
        <span 
          style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => handleSymbolClick(params.value)}
        >
          {params.value}
        </span>
      )},
    { field: 'ltp', headerName: 'Last Price ($)', type: 'number', width: 130 },
    { field: 'volume', headerName: 'Volume', type: 'number', width: 120 },
    { field: "timestamp", headerName: "Timestamp (IST)", width: 200, valueFormatter: (params) => (
        moment(params.value).tz("Asia/Kolkata").format("DD/MM/YYYY HH:mm:ss")
      )}
  ];

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ textAlign: 'center' }}>Cryptocurrency Tracker</h1>

      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <Button variant="contained" color="primary" onClick={startStreaming} disabled={isStreaming} style={{ marginRight: 10 }}>
          Start
        </Button>
        <Button variant="contained" color="secondary" onClick={stopStreaming} disabled={!isStreaming}>
          Stop
        </Button>
      </div>

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid rows={data} columns={columns} pageSize={10} />
      </div>
    </div>
  );
}

export default Home;