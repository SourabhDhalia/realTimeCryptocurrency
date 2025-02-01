// src/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

export const fetchCryptoData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/crypto`);
    return response.data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return [];
  }
};

export const fetchCandleData = async (symbol) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/last7days/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return [];
  }
};

export const startStreaming = async () => {
  try {
    await axios.post(`${API_BASE_URL}/stream/start`);
  } catch (error) {
    console.error('Error starting streaming:', error);
  }
};

export const stopStreaming = async () => {
  try {
    await axios.post(`${API_BASE_URL}/stream/stop`);
  } catch (error) {
    console.error('Error stopping streaming:', error);
  }
};