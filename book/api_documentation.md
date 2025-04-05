# Retail Analytics API Documentation

This document provides a comprehensive guide to the Retail Analytics API, including available endpoints, request parameters, response formats, and integration examples.

## Base URL

All API requests should be directed to the base URL:

```
http://localhost:5001/api
```

## Authentication

Authentication is currently not implemented in the development version. In a production environment, implement token-based authentication.

## API Endpoints

### Health Check

#### GET /health

Returns the health status of the API and information about loaded data.

**Response:**

```json
{
  "status": "healthy",
  "data_loaded": {
    "sales": [421570, 8],
    "features": [8190, 12],
    "stores": [45, 3]
  }
}
```

### Sales Data

#### GET /api/sales/

Returns paginated sales data with optional filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | Integer | Page number for pagination (default: 1) |
| per_page | Integer | Number of records per page (default: 100) |
| store_id | Integer | Filter by store ID |
| dept_id | Integer | Filter by department ID |
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |
| is_holiday | Boolean | Filter by holiday status |

**Response:**

```json
{
  "data": [
    {
      "Store": 1,
      "Dept": 1,
      "Date": "2010-02-05",
      "Weekly_Sales": 24924.5,
      "IsHoliday": false
    },
    // Additional records...
  ],
  "page": 1,
  "per_page": 100,
  "total": 421570
}
```

#### GET /api/sales/summary

Returns summary statistics for sales data.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |
| store_id | Integer | Filter by store ID |
| dept_id | Integer | Filter by department ID |

**Response:**

```json
{
  "avg_weekly_sales": 15981.25812346704,
  "count": 421570,
  "max_weekly_sales": 693099.36,
  "min_weekly_sales": -4988.94,
  "total_sales": 6737218987.11,
  "topStores": [
    {"Store": 20, "Sales": 301548982.45},
    // Additional stores...
  ],
  "topDepartments": [
    {"Dept": 7, "Sales": 355036554.13},
    // Additional departments...
  ],
  "holidaySales": {
    "holidayAvg": 17035.82,
    "nonHolidayAvg": 15901.45,
    "difference": 1134.37,
    "percentageIncrease": 7.13
  }
}
```

#### GET /api/sales/by-store/{store_id}

Returns sales data for a specific store.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| store_id | Integer | Store ID |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |

**Response:**

```json
{
  "store_id": 1,
  "total_sales": 157281345.26,
  "avg_weekly_sales": 19456.78,
  "sales_by_dept": [
    {"Dept": 1, "Sales": 234567.89},
    // Additional departments...
  ],
  "sales_by_date": [
    {"Date": "2010-02-05", "Sales": 345678.90},
    // Additional dates...
  ]
}
```

#### GET /api/sales/by-department/{dept_id}

Returns sales data for a specific department.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| dept_id | Integer | Department ID |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |

**Response:**

```json
{
  "dept_id": 1,
  "total_sales": 98765432.10,
  "avg_weekly_sales": 12345.67,
  "sales_by_store": [
    {"Store": 1, "Sales": 234567.89},
    // Additional stores...
  ],
  "sales_by_date": [
    {"Date": "2010-02-05", "Sales": 345678.90},
    // Additional dates...
  ]
}
```

#### GET /api/sales/by-date-range

Returns sales data within a specified date range.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Start date (required) |
| end_date | String (YYYY-MM-DD) | End date (required) |
| store_id | Integer | Filter by store ID |
| dept_id | Integer | Filter by department ID |

**Response:**

```json
{
  "start_date": "2010-02-05",
  "end_date": "2010-03-05",
  "total_sales": 123456789.10,
  "avg_weekly_sales": 23456.78,
  "sales_by_date": [
    {"Date": "2010-02-05", "Sales": 345678.90},
    // Additional dates...
  ]
}
```

#### GET /api/sales/holiday-comparison

Returns a comparison of holiday vs. non-holiday sales.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |
| store_id | Integer | Filter by store ID |
| dept_id | Integer | Filter by department ID |

**Response:**

```json
{
  "holiday_sales": {
    "total": 1234567890.12,
    "avg": 17035.82,
    "count": 72450
  },
  "non_holiday_sales": {
    "total": 5502651097.09,
    "avg": 15901.45,
    "count": 349120
  },
  "comparison": {
    "difference": 1134.37,
    "percentage_increase": 7.13
  }
}
```

#### GET /api/sales/time-series

Returns time series data for sales, suitable for charting.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |
| store_id | Integer | Filter by store ID |
| dept_id | Integer | Filter by department ID |
| aggregate | String | Aggregation level: 'day', 'week', 'month' (default: 'week') |

**Response:**

```json
[
  {
    "date": "2010-02-05",
    "sales": 23456789.10,
    "holiday": false
  },
  // Additional time points...
]
```

### Stores Data

#### GET /api/stores/

Returns data for all stores with optional filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| type | String | Filter by store type (A, B, or C) |
| min_size | Integer | Filter by minimum size (sq ft) |
| max_size | Integer | Filter by maximum size (sq ft) |

**Response:**

```json
{
  "count": 45,
  "data": [
    {
      "Store": 1,
      "Type": "A",
      "Size": 151315
    },
    // Additional stores...
  ]
}
```

#### GET /api/stores/{store_id}

Returns data for a specific store.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| store_id | Integer | Store ID |

**Response:**

```json
{
  "Store": 1,
  "Type": "A",
  "Size": 151315,
  "total_sales": 157281345.26,
  "avg_weekly_sales": 19456.78,
  "top_departments": [
    {"Dept": 7, "Sales": 13456789.12},
    // Additional departments...
  ],
  "sales_trend": [
    {"Date": "2010-02-05", "Sales": 345678.90},
    // Additional dates...
  ]
}
```

#### GET /api/stores/performance

Returns performance metrics for all stores.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |

**Response:**

```json
{
  "count": 45,
  "data": [
    {
      "Store": 1,
      "Type": "A",
      "Size": 151315,
      "total_sales": 157281345.26,
      "avg_weekly_sales": 19456.78,
      "sales_per_sqft": 128.45
    },
    // Additional stores...
  ]
}
```

#### GET /api/stores/types

Returns summary statistics by store type.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |

**Response:**

```json
[
  {
    "type": "A",
    "count": 22,
    "totalSales": 3456789012.34,
    "avgWeeklySales": 19345.67,
    "avgSize": 175432,
    "salesPerSqFt": 110.34
  },
  // Type B and C summaries...
]
```

### Analytics Endpoints

#### GET /api/analytics/summary

Returns summary statistics for sales, features, and stores.

**Response:**

```json
{
  "sales": {
    "avg_weekly_sales": 15981.25812346704,
    "count": 421570,
    "max_weekly_sales": 693099.36,
    "min_weekly_sales": -4988.94,
    "total_sales": 6737218987.11
  },
  "features": {
    "CPI": {
      "max": 228.9764563,
      "mean": 173.1967516125641,
      "median": 182.7640032,
      "min": 126.064
    },
    // Additional feature metrics...
  },
  "stores": {
    "avg_size": 130287.6,
    "count": 45,
    "type_distribution": {
      "A": 22,
      "B": 17,
      "C": 6
    }
  }
}
```

#### GET /api/analytics/department-performance

Returns performance metrics for all departments.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |
| store_id | Integer | Filter by store ID |

**Response:**

```json
{
  "count": 99,
  "data": [
    {
      "Dept": 1,
      "total_sales": 98765432.10,
      "avg_weekly_sales": 12345.67,
      "store_count": 45,
      "holiday_impact": 6.78
    },
    // Additional departments...
  ]
}
```

#### GET /api/analytics/markdown-impact

Returns analysis of markdown impact on sales.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |
| store_id | Integer | Filter by store ID |
| dept_id | Integer | Filter by department ID |

**Response:**

```json
{
  "overall_impact": {
    "correlation": 0.345,
    "significance": "moderate"
  },
  "markdowns": [
    {
      "markdown_type": "MarkDown1",
      "avg_value": 5870.37,
      "correlation": 0.234,
      "impact_percentage": 4.56
    },
    // Additional markdown types...
  ]
}
```

#### GET /api/analytics/holiday-comparison

Returns detailed comparison of holiday vs. non-holiday sales.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |
| store_id | Integer | Filter by store ID |
| dept_id | Integer | Filter by department ID |

**Response:**

```json
{
  "overall": {
    "holiday_avg": 17035.82,
    "non_holiday_avg": 15901.45,
    "difference": 1134.37,
    "percentage_increase": 7.13
  },
  "by_store_type": [
    {
      "type": "A",
      "holiday_avg": 19456.78,
      "non_holiday_avg": 17891.23,
      "difference": 1565.55,
      "percentage_increase": 8.75
    },
    // Type B and C comparisons...
  ],
  "by_department": [
    {
      "dept": 1,
      "holiday_avg": 12345.67,
      "non_holiday_avg": 11234.56,
      "difference": 1111.11,
      "percentage_increase": 9.89
    },
    // Additional departments...
  ]
}
```

#### GET /api/analytics/products/performance

Returns performance metrics for products (departments), including calculated sales growth, with optional filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `store_id` | Integer | Optional. Filter results by a specific store ID. |
| `start_date` | String (YYYY-MM-DD) | Optional. The start date for the primary analysis period. Defaults to 30 days prior to `end_date` or today if `end_date` is also omitted. |
| `end_date` | String (YYYY-MM-DD) | Optional. The end date for the primary analysis period. Defaults to today. |

**Response:**

Returns a standard formatted response object:

```json
{
  "status": "success",
  "data": [
    {
      "dept_id": 72,
      "name": "PRODUCE", 
      "category": "Food",
      "store_presence": 45,
      "total_sales": 123456.78, // Sales within the specified or default start/end date
      "total_sales_previous": 110101.01, // Sales in the immediately preceding period of same duration
      "sales_growth_rate": 12.13, // Percentage growth: (current - previous) / previous * 100
      "avg_sales": 2500.50, // Average weekly sales overall (across wider date range)
      "months_active": 33 // Number of distinct months with sales activity
    },
    // ... more product/department objects
  ]
}
```

**Notes:**

*   The `sales_growth_rate` compares the period defined by `start_date` and `end_date` (or defaults) to the immediately preceding period of the same duration.
*   `avg_sales` and `months_active` are calculated based on the wider timeframe encompassing both the current and previous comparison periods.

#### GET /api/analytics/inventory

Returns inventory data for all products.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| store_id | Integer | Filter by store ID |
| dept_id | Integer | Filter by department ID |

**Response:**

```json
{
  "data": [
    {
      "Store": 1,
      "Dept": 1,
      "Product": "Apple",
      "Quantity": 100,
      "ReorderLevel": 20,
      "RestockDate": "2024-03-15"
    },
    // Additional inventory records...
  ]
}
```

#### GET /api/analytics/inventory/metrics

Returns inventory metrics for all products.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| store_id | Integer | Filter by store ID |
| dept_id | Integer | Filter by department ID |

**Response:**

```json
{
  "data": [
    {
      "Store": 1,
      "Dept": 1,
      "Product": "Apple",
      "Quantity": 100,
      "ReorderLevel": 20,
      "RestockDate": "2024-03-15",
      "InventoryTurnover": 2.5,
      "DaysSalesOfInventory": 14.4
    },
    // Additional inventory metrics...
  ]
}
```

### Reports Endpoints

#### GET /api/analytics/markdown-impact

Returns analysis of markdown impact on sales.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | String (YYYY-MM-DD) | Filter by start date |
| end_date | String (YYYY-MM-DD) | Filter by end date |
| store_id | Integer | Filter by store ID |
| dept_id | Integer | Filter by department ID |

**Response:**

```json
{
  "overall_impact": {
    "correlation": 0.345,
    "significance": "moderate"
  },
  "markdowns": [
    {
      "markdown_type": "MarkDown1",
      "avg_value": 5870.37,
      "correlation": 0.234,
      "impact_percentage": 4.56
    },
    // Additional markdown types...
  ]
}
```

## Frontend Integration

### Service Layer

The frontend application uses a service layer to interact with the API:

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const retailDataService = {
  async getSalesSummary(startDate?: string, endDate?: string): Promise<SalesSummary> {
    try {
      let url = `${API_BASE_URL}/sales/summary`;
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      return {
        totalSales: 0,
        avgWeeklySales: 0,
        maxWeeklySales: 0,
        minWeeklySales: 0,
        topStores: [],
        topDepartments: [],
        holidaySales: {
          holidayAvg: 0,
          nonHolidayAvg: 0,
          difference: 0,
          percentageIncrease: 0
        }
      };
    }
  },

  async getStoreTypeSummary(startDate?: string, endDate?: string): Promise<StoreTypeSummary[]> {
    try {
      let url = `${API_BASE_URL}/analytics/store-performance`;
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching store type summary:', error);
      return [];
    }
  },

  async getSalesTrend(startDate?: string, endDate?: string): Promise<SalesTrendData[]> {
    try {
      let url = `${API_BASE_URL}/sales/time-series`;
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales trend:', error);
      return [];
    }
  }
};

export default retailDataService;
```

### React Components

Components like the `Dashboard` consume the API data:

```typescript
const Dashboard = () => {
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [storeTypeSummary, setStoreTypeSummary] = useState<any>(null);
  const [salesTrend, setSalesTrend] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      const [salesData, storeTypeData, trendData] = await Promise.all([
        retailDataService.getSalesSummary(startDate, endDate),
        retailDataService.getStoreTypeSummary(startDate, endDate),
        retailDataService.getSalesTrend(startDate, endDate)
      ]);
      
      setSalesSummary(salesData);
      setStoreTypeSummary(storeTypeData);
      setSalesTrend(trendData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Component rendering...
};
```

## Error Handling

The API returns appropriate HTTP status codes for different error conditions:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

Error responses follow this format:

```json
{
  "status": "error",
  "message": "Detailed error message",
  "error": "Error type or code"
}
```

## Rate Limiting

The development version does not implement rate limiting. In a production environment, implement appropriate rate limiting based on expected usage patterns.

## Pagination

Endpoints that return large datasets support pagination with these parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| page | Integer | Page number (default: 1) |
| per_page | Integer | Records per page (default: 100, max: 1000) |

Paginated responses include metadata:

```json
{
  "data": [...],
  "page": 1,
  "per_page": 100,
  "total": 421570
}
``` 