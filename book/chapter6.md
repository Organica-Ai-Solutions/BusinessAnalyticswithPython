# Chapter 6: Analytical Techniques for Retail Data

## Introduction to Retail Analytics Techniques

This chapter explores the core analytical techniques essential for retail data analysis, focusing on methods implemented within our project. We'll cover backend data retrieval using Flask and frontend visualization using vanilla JavaScript with Chart.js.

## Backend Data Retrieval and Processing (Flask/SQLite)

The backend uses Flask to serve API endpoints that query a SQLite database. Key techniques involve SQL aggregation and data transformation.

### Example: Fetching Sales Statistics (`backend/src/routes/dashboard.py`)

```python
from flask import Blueprint, jsonify
from datetime import datetime
from src.database.db import get_db_connection, row_to_dict

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats')
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get aggregated sales stats for the current year
    current_year = datetime.now().year
    cursor.execute("""
        SELECT 
            SUM(weekly_sales) as total_sales,
            COUNT(DISTINCT sale_id) as total_orders,
            AVG(weekly_sales) as average_order_value
        FROM sales 
        WHERE strftime('%Y', date) = ?
    """, (str(current_year),))
    stats = row_to_dict(cursor.fetchone())
    
    # Example calculation (Conversion Rate)
    cursor.execute("""
        SELECT COUNT(*) as total_visits 
        FROM sales 
        WHERE strftime('%Y', date) = ?
    """, (str(current_year),))
    total_visits = cursor.fetchone()[0]
    stats['conversion_rate'] = round((stats.get('total_orders', 0) / total_visits * 100), 2) if total_visits > 0 else 0
    
    conn.close()
    return jsonify(stats)

@dashboard_bp.route('/sales')
def get_sales():
    # ... (Implementation for fetching daily sales for charts) ...

# Other routes follow similar patterns (grouping, aggregation)
```

### Database Interaction (`backend/src/database/db.py`)

```python
import sqlite3
import os

DB_PATH = os.path.join(/*...path calculation...*/, "retail.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row # Return rows as dictionary-like objects
    return conn

def row_to_dict(row):
    if row is None: return None
    return {key: row[key] for key in row.keys()}

def rows_to_list(rows):
    if rows is None: return []
    return [row_to_dict(row) for row in rows]

# Functions for initializing DB, creating tables, loading sample data...
```

## Frontend Data Visualization (JavaScript/Chart.js)

The frontend uses vanilla JavaScript and the Chart.js library to display data fetched from the backend API.

### Initializing Charts (`frontend/src/main.js`)

```javascript
import Chart from 'chart.js/auto';

let activeCharts = []; // Keep track of charts to destroy them later

function destroyActiveCharts() {
  activeCharts.forEach(chart => chart.destroy());
  activeCharts = [];
}

async function loadDashboard() {
  // ... Fetch data using API calls ...
  // const [stats, salesData, categoryData, regionalData, topProducts] = await Promise.all([...]);

  destroyActiveCharts(); // Destroy previous charts before creating new ones
  
  const mainContent = document.getElementById('main-content');
  // ... Generate HTML structure for dashboard cards and chart canvases ...
  mainContent.innerHTML = `<!-- HTML with canvas elements like #salesTrendChart -->`;

  // Initialize Sales Trend Chart
  const salesTrendCtx = document.getElementById('salesTrendChart')?.getContext('2d');
  if (salesTrendCtx && salesData?.dates && salesData?.sales) {
    const salesTrendChart = new Chart(salesTrendCtx, {
      type: 'line',
      data: {
        labels: salesData.dates,
        datasets: [{
          label: 'Sales',
          data: salesData.sales,
          borderColor: '#0d6efd',
          tension: 0.4 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // ... other options ...
      }
    });
    activeCharts.push(salesTrendChart);
  }

  // Initialize Category Chart (Doughnut)
  const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
  if (categoryCtx && categoryData?.categories && categoryData?.sales) {
    const categoryChart = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: categoryData.categories,
        datasets: [{
          data: categoryData.sales,
          backgroundColor: [/* array of colors */] 
        }]
      },
      options: { /* ... options ... */ }
    });
    activeCharts.push(categoryChart);
  }
  
  // Initialize Regional Chart (Bar)
  const regionalCtx = document.getElementById('regionalChart')?.getContext('2d');
   if (regionalCtx && regionalData?.regions && regionalData?.sales) {
      const regionalChart = new Chart(regionalCtx, {
        type: 'bar',
        data: {
          labels: regionalData.regions,
          datasets: [{
            label: 'Sales',
            data: regionalData.sales,
            backgroundColor: '#0d6efd'
          }]
        },
        options: { /* ... options ... */ }
      });
      activeCharts.push(regionalChart);
    }
}
```

### Frontend Data Fetching (`frontend/src/services/api.js`)

```javascript
// API Configuration
const API_BASE_URL = '/api'; // Uses Vite proxy

// Helper function for making API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include', // Important for session/cookies if used
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

// API Service Classes (Example: DashboardApi)
export class DashboardApi {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async getStats() {
    return apiCall('/dashboard/stats');
  }
  
  async getSalesData() {
    return apiCall('/dashboard/sales');
  }
  // ... other methods for categories, regions, top products ...
}

// Similar classes for AnalyticsApi, ReportsApi
```

## Frontend Data Analysis (`frontend/src/services/dataAnalysis.js`)

Simple data analysis or transformation might occur on the frontend.

```javascript
export class DataAnalysisService {
  
  analyzeSalesTrends(salesData) {
    // Basic check for valid data structure
    if (!salesData || !Array.isArray(salesData.dates) || !Array.isArray(salesData.sales)) {
      console.error("Invalid sales data provided:", salesData);
      throw new Error('Invalid sales data for analysis');
    }
    if (salesData.dates.length === 0) {
      return { trend: 'No data', projection: 0 };
    }

    // Example: Simple trend calculation based on first and last points
    const data = salesData.dates.map((date, index) => ({
      date: new Date(date),
      sales: salesData.sales[index]
    }));
    data.sort((a, b) => a.date - b.date); // Ensure sorted by date

    const firstSales = data[0].sales;
    const lastSales = data[data.length - 1].sales;

    let trend = 'Stable';
    if (lastSales > firstSales * 1.1) trend = 'Upward';
    if (lastSales < firstSales * 0.9) trend = 'Downward';

    // Simple projection: Average of the last 7 days
    const last7DaysSales = data.slice(-7).map(d => d.sales);
    const projection = last7DaysSales.reduce((sum, val) => sum + val, 0) / Math.max(1, last7DaysSales.length);

    return { trend, projection };
  }

  // Other potential methods for simple frontend analysis
}
```

## Best Practices Summary

1.  **Backend**: Use SQL for efficient data aggregation and filtering close to the data source. Expose clear, well-defined API endpoints.
2.  **Frontend**: Fetch processed data from the backend. Use a charting library like Chart.js for visualization. Handle UI updates and interactivity. Manage chart instances to prevent memory leaks.
3.  **Data Flow**: Keep complex calculations and business logic primarily on the backend. The frontend should focus on presentation and user interaction.
4.  **Error Handling**: Implement robust error handling for API calls and frontend rendering.
5.  **Performance**: Cache data where appropriate (e.g., using `@st.cache_data` in Streamlit, or simple JS variables/local storage for short-term caching). Destroy chart instances when they are no longer needed.

The next chapter will focus on designing effective retail dashboards using these actual project techniques. 