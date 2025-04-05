// Environment configuration
const env = import.meta.env.MODE || 'development';

// Base configuration
const config = {
  development: {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws',
    defaultTheme: 'light',
    defaultView: 'dashboard',
    enableAnimations: true,
    enableRealtime: true,
    chartStyle: 'modern',
    apiTimeout: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    dateFormat: 'YYYY-MM-DD',
    currencyFormat: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    },
    chartDefaults: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 10,
            usePointStyle: true
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          padding: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#000',
          bodyColor: '#666',
          borderColor: '#e9ecef',
          borderWidth: 1,
          titleFont: {
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [2, 2]
          }
        }
      }
    }
  },
  production: {
    apiUrl: import.meta.env.VITE_API_URL || 'https://api.retail-analytics.com',
    wsUrl: import.meta.env.VITE_WS_URL || 'wss://api.retail-analytics.com/ws',
    defaultTheme: 'system',
    defaultView: 'dashboard',
    enableAnimations: true,
    enableRealtime: true,
    chartStyle: 'modern',
    apiTimeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    dateFormat: 'YYYY-MM-DD',
    currencyFormat: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    },
    chartDefaults: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 10,
            usePointStyle: true
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          padding: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#000',
          bodyColor: '#666',
          borderColor: '#e9ecef',
          borderWidth: 1,
          titleFont: {
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            borderDash: [2, 2]
          }
        }
      }
    }
  },
  test: {
    apiUrl: 'http://localhost:5000/api',
    wsUrl: 'ws://localhost:5000/ws',
    defaultTheme: 'light',
    defaultView: 'dashboard',
    enableAnimations: false,
    enableRealtime: false,
    chartStyle: 'modern',
    apiTimeout: 1000,
    maxRetries: 0,
    retryDelay: 0,
    dateFormat: 'YYYY-MM-DD',
    currencyFormat: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    },
    chartDefaults: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      }
    }
  }
};

// Export environment-specific configuration
export default config[env];

// Export helper functions
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', config[env].currencyFormat).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatNumber = (number, decimals = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

export const formatPercent = (value, decimals = 1) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.response) {
    // Server responded with error
    return `Server error: ${error.response.data?.message || error.response.statusText}`;
  } else if (error.request) {
    // Request made but no response
    return 'No response from server. Please check your connection.';
  } else {
    // Request setup error
    return 'Error making request. Please try again.';
  }
}; 