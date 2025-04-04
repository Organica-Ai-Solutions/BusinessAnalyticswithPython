import axios from 'axios';

// Define API base URL - adjust as needed for your environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Define interfaces for the data
export interface StoreData {
  Store: number;
  Type: string;
  Size: number;
  WeeklySales?: number;
}

export interface SalesData {
  Store: number;
  Dept: number;
  Date: string;
  Weekly_Sales: number;
  IsHoliday: boolean;
}

export interface FeatureData {
  Store: number;
  Date: string;
  Temperature: number;
  Fuel_Price: number;
  MarkDown1: number | null;
  MarkDown2: number | null;
  MarkDown3: number | null;
  MarkDown4: number | null;
  MarkDown5: number | null;
  CPI: number | null;
  Unemployment: number | null;
  IsHoliday: boolean;
}

export interface SalesSummary {
  totalSales: number;
  avgWeeklySales: number;
  maxWeeklySales: number;
  minWeeklySales: number;
  topStores: Array<{ Store: number; Sales: number }>;
  topDepartments: Array<{ Dept: number; Sales: number }>;
  holidaySales: { 
    holiday: number; 
    nonHoliday: number; 
    difference: number; 
    percentageIncrease: number;
    holidayAvg: number;
    nonHolidayAvg: number;
  };
  monthlySales: Array<{ month: string; sales: number }>;
}

export interface StoreTypeSummary {
  type: string;
  totalSales: number;
  avgWeeklySales: number;
  count: number;
  avgSize: number;
  salesPerSqFt: number;
}

// Service functions for fetching data
const retailDataService = {
  // For development/demo purposes, we'll mock the API responses
  // In a real application, these would actually call the backend
  
  async getStores(): Promise<StoreData[]> {
    try {
      // In a real app, this would be:
      // const response = await axios.get(`${API_BASE_URL}/stores`);
      // return response.data;
      
      // For now, use mock data or local file
      // This assumes you've set up a proxy or have CORS configured
      const response = await axios.get('/data/stores_data.json');
      return response.data;
    } catch (error) {
      console.error('Error fetching store data:', error);
      // Return some demo data for testing
      return demoStoreData;
    }
  },
  
  async getSales(): Promise<SalesData[]> {
    try {
      const response = await axios.get('/data/sales_data.json');
      return response.data;
    } catch (error) {
      console.error('Error fetching sales data:', error);
      // Return some limited demo data
      return demoSalesData.slice(0, 100); // Limited data for performance
    }
  },
  
  async getFeatures(): Promise<FeatureData[]> {
    try {
      const response = await axios.get('/data/features_data.json');
      return response.data;
    } catch (error) {
      console.error('Error fetching feature data:', error);
      return demoFeatureData.slice(0, 100); // Limited data for performance
    }
  },
  
  async getSalesSummary(): Promise<SalesSummary> {
    try {
      const response = await axios.get(`${API_BASE_URL}/sales/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      return demoSalesSummary;
    }
  },
  
  async getStoreTypeSummary(): Promise<StoreTypeSummary[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/stores/summary-by-type`);
      return response.data;
    } catch (error) {
      console.error('Error fetching store type summary:', error);
      return demoStoreTypeSummary;
    }
  }
};

// Demo data for development
const demoStoreData: StoreData[] = [
  { Store: 1, Type: 'A', Size: 151315 },
  { Store: 2, Type: 'A', Size: 202307 },
  { Store: 3, Type: 'B', Size: 37392 },
  { Store: 4, Type: 'A', Size: 205863 },
  { Store: 5, Type: 'B', Size: 34875 }
];

const demoSalesData: SalesData[] = [
  { Store: 1, Dept: 1, Date: '2010-02-05', Weekly_Sales: 24924.5, IsHoliday: false },
  { Store: 1, Dept: 1, Date: '2010-02-12', Weekly_Sales: 46039.49, IsHoliday: true },
  { Store: 1, Dept: 1, Date: '2010-02-19', Weekly_Sales: 41595.55, IsHoliday: false },
  { Store: 1, Dept: 1, Date: '2010-02-26', Weekly_Sales: 19403.54, IsHoliday: false },
  { Store: 1, Dept: 2, Date: '2010-02-05', Weekly_Sales: 50605.27, IsHoliday: false }
];

const demoFeatureData: FeatureData[] = [
  { Store: 1, Date: '2010-02-05', Temperature: 42.31, Fuel_Price: 2.572, MarkDown1: null, MarkDown2: null, MarkDown3: null, MarkDown4: null, MarkDown5: null, CPI: 211.0964, Unemployment: 8.106, IsHoliday: false },
  { Store: 1, Date: '2010-02-12', Temperature: 38.51, Fuel_Price: 2.548, MarkDown1: null, MarkDown2: null, MarkDown3: null, MarkDown4: null, MarkDown5: null, CPI: 211.2422, Unemployment: 8.106, IsHoliday: true },
  { Store: 1, Date: '2010-02-19', Temperature: 39.93, Fuel_Price: 2.514, MarkDown1: null, MarkDown2: null, MarkDown3: null, MarkDown4: null, MarkDown5: null, CPI: 211.2891, Unemployment: 8.106, IsHoliday: false },
  { Store: 1, Date: '2010-02-26', Temperature: 46.63, Fuel_Price: 2.561, MarkDown1: null, MarkDown2: null, MarkDown3: null, MarkDown4: null, MarkDown5: null, CPI: 211.3196, Unemployment: 8.106, IsHoliday: false },
  { Store: 1, Date: '2010-03-05', Temperature: 46.50, Fuel_Price: 2.625, MarkDown1: null, MarkDown2: null, MarkDown3: null, MarkDown4: null, MarkDown5: null, CPI: 211.3501, Unemployment: 8.106, IsHoliday: false }
];

const demoSalesSummary: SalesSummary = {
  totalSales: 6737218987.11,
  avgWeeklySales: 47113419.49,
  maxWeeklySales: 80931415.60,
  minWeeklySales: 39599852.99,
  topStores: [
    { Store: 20, Sales: 301397792.46 },
    { Store: 4, Sales: 299543953.38 },
    { Store: 14, Sales: 288999911.34 },
    { Store: 13, Sales: 286517703.80 },
    { Store: 2, Sales: 275382440.98 }
  ],
  topDepartments: [
    { Dept: 92, Sales: 483943341.87 },
    { Dept: 95, Sales: 449320162.52 },
    { Dept: 38, Sales: 393118136.92 },
    { Dept: 72, Sales: 305725152.21 },
    { Dept: 90, Sales: 291068463.68 }
  ],
  holidaySales: {
    holiday: 17035.82,
    nonHoliday: 15901.45,
    difference: 1134.37,
    percentageIncrease: 7.13,
    holidayAvg: 17035.82,
    nonHolidayAvg: 15901.45
  },
  monthlySales: [
    { month: 'Jan', sales: 458762309.45 },
    { month: 'Feb', sales: 427563219.32 },
    { month: 'Mar', sales: 489371265.78 },
    { month: 'Apr', sales: 512687420.15 },
    { month: 'May', sales: 548923156.25 },
    { month: 'Jun', sales: 568245789.65 },
    { month: 'Jul', sales: 575120450.32 },
    { month: 'Aug', sales: 597256841.95 },
    { month: 'Sep', sales: 582145732.45 },
    { month: 'Oct', sales: 598723451.26 },
    { month: 'Nov', sales: 678425689.32 },
    { month: 'Dec', sales: 699993662.21 }
  ]
};

const demoStoreTypeSummary: StoreTypeSummary[] = [
  { type: 'A', totalSales: 4331014722.75, avgWeeklySales: 196864305.58, count: 22, avgSize: 178460, salesPerSqFt: 1103.58 },
  { type: 'B', totalSales: 2000700736.82, avgWeeklySales: 117688278.64, count: 17, avgSize: 97562, salesPerSqFt: 1206.28 },
  { type: 'C', totalSales: 405503527.54, avgWeeklySales: 67583921.26, count: 6, avgSize: 77180, salesPerSqFt: 875.64 }
];

export default retailDataService; 