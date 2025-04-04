// Store related types
export interface Store {
  store_id: number;
  name: string;
  region: string;
  size_sqft: number;
  type: string;
}

// Department related types
export interface Department {
  dept_id: number;
  name: string;
  category: string;
}

// Sales related types
export interface Sale {
  sale_id: number;
  store_id: number;
  store_name: string;
  dept_id: number;
  dept_name: string;
  date: string;
  weekly_sales: number;
  is_holiday: number;
  temperature: number;
  fuel_price: number;
  markdown: number;
  cpi: number;
  unemployment: number;
}

export interface SalesSummaryByStore {
  store_id: number;
  store_name: string;
  region: string;
  type: string;
  total_sales: number;
  avg_weekly_sales: number;
  weeks_count: number;
}

export interface SalesSummaryByDepartment {
  dept_id: number;
  dept_name: string;
  category: string;
  total_sales: number;
  avg_weekly_sales: number;
  weeks_count: number;
}

export interface SalesSummaryByDate {
  time_period: string;
  total_sales: number;
  avg_weekly_sales: number;
  record_count: number;
}

// KPI related types
export interface KPIs {
  total_sales: number;
  avg_weekly_sales: number;
  sales_growth: number;
  store_count: number;
  dept_count: number;
  avg_markdown: number;
  holiday_sales_percentage: number;
  prev_period_sales: number;
}

// Seasonality related types
export interface SeasonalityByMonth {
  month: number;
  month_name: string;
  avg_sales: number;
  seasonality_index: number;
}

export interface SeasonalityByWeekday {
  weekday: number;
  weekday_name: string;
  avg_sales: number;
  seasonality_index: number;
}

// Correlation related types
export interface Correlation {
  factor: string;
  correlation: number;
}

// Top performers related types
export interface TopStore {
  store_id: number;
  store_name: string;
  region: string;
  type: string;
  total_sales: number;
  avg_sales: number;
  dept_count: number;
}

export interface TopDepartment {
  dept_id: number;
  dept_name: string;
  category: string;
  total_sales: number;
  avg_sales: number;
  store_count: number;
}

// Filter related types
export interface Filters {
  store_id?: number;
  dept_id?: number;
  start_date?: string;
  end_date?: string;
  group_by?: 'store' | 'department' | 'date';
  time_period?: 'day' | 'week' | 'month' | 'year';
  dimension?: 'month' | 'weekday';
  type?: 'store' | 'department';
  limit?: number;
} 