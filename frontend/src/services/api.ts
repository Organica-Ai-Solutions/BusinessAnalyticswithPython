import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Define the axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sales API calls
export const getSales = async (params: any = {}) => {
  const response = await apiClient.get('/sales', { params });
  return response.data;
};

export const getSalesSummary = async (params: any = {}) => {
  const response = await apiClient.get('/sales/summary', { params });
  return response.data;
};

export const getStores = async () => {
  const response = await apiClient.get('/sales/stores');
  return response.data;
};

export const getDepartments = async () => {
  const response = await apiClient.get('/sales/departments');
  return response.data;
};

// Analytics API calls
export const getKPIs = async (params: any = {}) => {
  const response = await apiClient.get('/analytics/kpis', { params });
  return response.data;
};

export const getSeasonality = async (params: any = {}) => {
  const response = await apiClient.get('/analytics/seasonality', { params });
  return response.data;
};

export const getCorrelation = async (params: any = {}) => {
  const response = await apiClient.get('/analytics/correlation', { params });
  return response.data;
};

export const getTopPerformers = async (params: any = {}) => {
  const response = await apiClient.get('/analytics/top-performers', { params });
  return response.data;
}; 