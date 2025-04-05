import { io } from 'socket.io-client';
import { mockDashboardApi, mockAnalyticsApi, mockReportsApi } from './mockApi';

// API Configuration
const API_BASE_URL = '/api';
const WS_BASE_URL = '/';
const USE_MOCK_API = false; // Toggle this to switch between mock and real API

// Helper function for making API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API call failed: ${error.message}`);
        throw error;
    }
}

// Generic API request handler with error handling
async function apiRequest(endpoint, options = {}) {
  if (USE_MOCK_API) {
    // Return mock data if using mock API
    return options.mockResponse();
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// API Service for retail analytics dashboard
export class DashboardApi {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Fetch dashboard statistics
  async getStats() {
    return apiCall('/dashboard/stats');
  }

  // Fetch sales data
  async getSalesData() {
    return apiCall('/dashboard/sales');
  }

  // Fetch category data
  async getCategoryData() {
    return apiCall('/dashboard/categories');
  }

  // Fetch regional data
  async getRegionalData() {
    return apiCall('/dashboard/regions');
  }

  // Fetch top products
  async getTopProducts() {
    return apiCall('/dashboard/top-products');
  }

  // Fetch recent activity
  async getRecentActivity() {
    const response = await fetch(`${this.baseUrl}/dashboard/activity`);
    if (!response.ok) throw new Error('Failed to fetch recent activity');
    return response.json();
  }

  // Export dashboard report
  async exportReport(format) {
    return apiCall('/dashboard/export', {
      method: 'POST',
      body: JSON.stringify({ format })
    });
  }

  // Add the getStores method here
  async getStores() {
    return apiCall('/dashboard/stores');
  }
}

// Analytics API calls
export const analyticsApi = {
  getInventoryMetrics: () => apiCall('/analytics/inventory/metrics'),
  getProductPerformance: (filters = {}) => {
    const params = new URLSearchParams();
    // Ensure storeId is not empty before appending
    if (filters.storeId && filters.storeId !== '') {
        params.append('store_id', filters.storeId);
    }
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    const queryString = params.toString();
    const url = `/analytics/products/performance${queryString ? `?${queryString}` : ''}`;
    console.log('Fetching Product Performance with filters:', url); 
    return apiCall(url).catch(error => {
        console.error(`Error fetching product performance from ${url}:`, error);
        throw new Error('Failed to fetch product performance');
      });
  },
  getInventoryData: () => {
    const url = '/analytics/inventory';
    console.log('Fetching Inventory Data:', url);
    return apiCall(url).catch(error => {
        console.error(`Error fetching inventory data from ${url}:`, error);
        throw new Error('Failed to fetch inventory data');
      });
  },
  // ... (other methods)
};

export class ReportsApi {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Get list of reports
  async getReportsList() {
    return apiCall('/reports');
  }

  // Get scheduled reports
  async getScheduledReports() {
    return apiCall('/reports/scheduled');
  }

  // Create new report
  async createReport(reportData) {
    const response = await fetch(`${this.baseUrl}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });
    if (!response.ok) throw new Error('Failed to create report');
    return response.json();
  }

  // Delete report
  async deleteReport(reportId) {
    return apiCall(`/reports/${reportId}`, { method: 'DELETE' });
  }

  // Download report
  async downloadReport(reportId) {
    return apiCall(`/reports/${reportId}/download`);
  }
}

// Real-time updates using Socket.IO
export class RealtimeUpdates {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.eventHandlers = new Map();
        this.isConnecting = false;
    }

    async connect() {
        if (this.socket?.connected) {
            return;
        }

        if (this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        try {
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }

            this.socket = io({
                path: '/socket.io',
                transports: ['polling', 'websocket'],
                upgrade: true,
                rememberUpgrade: true,
                secure: true,
                rejectUnauthorized: false,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 5000,
                autoConnect: false,
                withCredentials: true
            });

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 5000);

                this.socket.on('connect', () => {
                    clearTimeout(timeout);
                    this.reconnectAttempts = 0;
                    console.log('Socket connected successfully');
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.error('Socket connection error:', error);
                    reject(error);
                });

                this.socket.connect();
            });

            this.setupEventListeners();
        } catch (error) {
            console.error('Socket connection failed:', error);
            this.reconnectAttempts++;
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.close();
            this.socket = null;
        }
        this.eventHandlers.clear();
    }

    setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        // Re-register existing event handlers
        this.eventHandlers.forEach((handler, event) => {
            this.socket.on(event, handler);
        });
    }

    on(event, handler) {
        if (!this.socket) return;
        this.eventHandlers.set(event, handler);
        this.socket.on(event, handler);
    }

    off(event) {
        if (!this.socket) return;
        this.eventHandlers.delete(event);
        this.socket.off(event);
    }

    emit(event, data) {
        if (!this.socket?.connected) return;
        this.socket.emit(event, data);
    }
}

// Export API instances
export const dashboardApi = new DashboardApi();
export const reportsApi = new ReportsApi();
export const realtimeUpdates = new RealtimeUpdates(); 