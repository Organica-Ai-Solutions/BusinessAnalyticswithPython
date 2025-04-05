// Mock data generator
function generateMockData() {
  return {
    stats: {
      sales: {
        avg_weekly_sales: 15981.26,
        count: 421570,
        max_weekly_sales: 693099.36,
        min_weekly_sales: -4988.94,
        total_sales: 6737218987.11
      },
      features: {
        CPI: {
          max: 228.98,
          mean: 173.20,
          median: 182.76,
          min: 126.06
        },
        Temperature: {
          max: 101.95,
          mean: 60.66,
          median: 61.46,
          min: -7.29
        }
      },
      stores: {
        avg_size: 130287.6,
        count: 45,
        type_distribution: {
          A: 22,
          B: 17,
          C: 6
        }
      }
    },
    salesData: {
      labels: ['2010-02-05', '2010-02-12', '2010-02-19', '2010-02-26', '2010-03-05', '2010-03-12'],
      data: [12000, 19000, 15000, 22000, 18000, 25000],
      forecast: [null, null, null, null, 20000, 27000]
    },
    categoryData: [
      {
        Dept: 1,
        total_sales: 98765432.10,
        avg_weekly_sales: 12345.67,
        store_count: 45,
        holiday_impact: 6.78
      },
      {
        Dept: 2,
        total_sales: 87654321.98,
        avg_weekly_sales: 10987.65,
        store_count: 45,
        holiday_impact: 5.43
      },
      {
        Dept: 7,
        total_sales: 355036554.13,
        avg_weekly_sales: 18543.21,
        store_count: 45,
        holiday_impact: 9.87
      },
      {
        Dept: 55,
        total_sales: 76123456.78,
        avg_weekly_sales: 9876.54,
        store_count: 42,
        holiday_impact: 4.32
      },
      {
        Dept: 98,
        total_sales: 65432109.87,
        avg_weekly_sales: 8765.43,
        store_count: 40,
        holiday_impact: 7.65
      }
    ],
    salesByRegion: [
      {
        type: "A",
        count: 22,
        totalSales: 3456789012.34,
        avgWeeklySales: 19345.67,
        avgSize: 175432,
        salesPerSqFt: 110.34
      },
      {
        type: "B",
        count: 17,
        totalSales: 2345678901.23,
        avgWeeklySales: 16789.12,
        avgSize: 120543,
        salesPerSqFt: 98.76
      },
      {
        type: "C",
        count: 6,
        totalSales: 987654321.09,
        avgWeeklySales: 12345.67,
        avgSize: 95432,
        salesPerSqFt: 76.54
      }
    ],
    topProducts: [
      { Dept: 7, total_sales: 355036554.13, avg_weekly_sales: 18543.21, store_count: 45, holiday_impact: 9.87 },
      { Dept: 92, total_sales: 254398761.98, avg_weekly_sales: 17654.32, store_count: 45, holiday_impact: 8.76 },
      { Dept: 45, total_sales: 198765432.10, avg_weekly_sales: 16543.21, store_count: 44, holiday_impact: 7.65 },
      { Dept: 21, total_sales: 176543210.98, avg_weekly_sales: 15432.10, store_count: 45, holiday_impact: 6.54 },
      { Dept: 13, total_sales: 165432109.87, avg_weekly_sales: 14321.09, store_count: 43, holiday_impact: 5.43 }
    ],
    recentActivity: {
      avg_weekly_sales: 15981.26,
      count: 421570,
      max_weekly_sales: 693099.36,
      min_weekly_sales: -4988.94,
      total_sales: 6737218987.11,
      topStores: [
        {Store: 20, Sales: 301548982.45},
        {Store: 4, Sales: 199946059.75},
        {Store: 13, Sales: 195719152.11},
        {Store: 2, Sales: 186335642.71},
        {Store: 27, Sales: 184568512.44}
      ],
      topDepartments: [
        {Dept: 7, Sales: 355036554.13},
        {Dept: 72, Sales: 298198042.92},
        {Dept: 38, Sales: 251487849.34},
        {Dept: 90, Sales: 243144939.18},
        {Dept: 95, Sales: 237846574.49}
      ],
      holidaySales: {
        holidayAvg: 17035.82,
        nonHolidayAvg: 15901.45,
        difference: 1134.37,
        percentageIncrease: 7.13
      }
    },
    inventoryData: {
      count: 45,
      data: [
        {
          Store: 1,
          Type: "A",
          Size: 151315,
          total_sales: 157281345.26,
          avg_weekly_sales: 19456.78,
          sales_per_sqft: 128.45
        },
        {
          Store: 2,
          Type: "A",
          Size: 202307,
          total_sales: 186335642.71,
          avg_weekly_sales: 23054.26,
          sales_per_sqft: 114.17
        }
      ],
      suppliers: [
        { id: '1', name: 'Tech Suppliers Inc.' },
        { id: '2', name: 'Global Electronics Ltd.' }
      ],
      stockDistribution: [15, 45, 120, 20],
      turnoverTrend: {
        labels: ['2010-02-05', '2010-02-12', '2010-02-19', '2010-02-26', '2010-03-05', '2010-03-12'],
        data: [2.8, 3.1, 2.9, 3.4, 3.2, 3.5]
      }
    },
    turnoverMetrics: {
      overall_impact: {
        correlation: 0.345,
        significance: "moderate"
      },
      markdowns: [
        {
          markdown_type: "MarkDown1",
          avg_value: 5870.37,
          correlation: 0.234,
          impact_percentage: 4.56
        },
        {
          markdown_type: "MarkDown2",
          avg_value: 3978.12,
          correlation: 0.187,
          impact_percentage: 3.21
        },
        {
          markdown_type: "MarkDown3",
          avg_value: 6897.43,
          correlation: 0.412,
          impact_percentage: 6.78
        },
        {
          markdown_type: "MarkDown4",
          avg_value: 2145.67,
          correlation: 0.156,
          impact_percentage: 2.34
        },
        {
          markdown_type: "MarkDown5",
          avg_value: 4532.89,
          correlation: 0.289,
          impact_percentage: 5.12
        }
      ]
    },
    holidayComparison: {
      overall: {
        holiday_avg: 17035.82,
        non_holiday_avg: 15901.45,
        difference: 1134.37,
        percentage_increase: 7.13
      },
      by_store_type: [
        {
          type: "A",
          holiday_avg: 19456.78,
          non_holiday_avg: 17891.23,
          difference: 1565.55,
          percentage_increase: 8.75
        },
        {
          type: "B",
          holiday_avg: 16789.12,
          non_holiday_avg: 15432.10,
          difference: 1357.02,
          percentage_increase: 8.79
        },
        {
          type: "C",
          holiday_avg: 12345.67,
          non_holiday_avg: 11543.21,
          difference: 802.46,
          percentage_increase: 6.95
        }
      ],
      by_department: [
        {
          dept: 1,
          holiday_avg: 12345.67,
          non_holiday_avg: 11234.56,
          difference: 1111.11,
          percentage_increase: 9.89
        },
        {
          dept: 7,
          holiday_avg: 18543.21,
          non_holiday_avg: 16789.12,
          difference: 1754.09,
          percentage_increase: 10.45
        },
        {
          dept: 92,
          holiday_avg: 17654.32,
          non_holiday_avg: 16543.21,
          difference: 1111.11,
          percentage_increase: 6.72
        }
      ]
    }
  };
}

// Simulate network delay
function delay(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock API endpoints
export const mockDashboardApi = {
  getStats: async () => {
    await delay();
    return generateMockData().stats;
  },
  getSalesData: async (period = '6M') => {
    await delay();
    return generateMockData().salesData;
  },
  getCategoryData: async () => {
    await delay();
    return generateMockData().categoryData;
  },
  getRegionalData: async () => {
    await delay();
    return generateMockData().salesByRegion;
  },
  getTopProducts: async (limit = 5) => {
    await delay();
    return generateMockData().topProducts.slice(0, limit);
  },
  getRecentActivity: async (type = 'all') => {
    await delay();
    return generateMockData().recentActivity;
  },
  exportReport: async (format = 'pdf') => {
    await delay();
    return { success: true, message: `Report exported as ${format}` };
  }
};

export const mockAnalyticsApi = {
  getInventoryData: async () => {
    await delay();
    return generateMockData().inventoryData;
  },
  getLowStockItems: async () => {
    await delay();
    return generateMockData().turnoverMetrics;
  },
  getInventoryMetrics: async () => {
    await delay();
    return generateMockData().stats;
  },
  createPurchaseOrder: async (orderData) => {
    await delay();
    return { success: true, orderId: Math.random().toString(36).substr(2, 9) };
  },
  getInventoryItem: async (id) => {
    await delay();
    return generateMockData().holidayComparison;
  },
  getInventoryHistory: async (id) => {
    await delay();
    return generateMockData().topProducts;
  }
};

export const mockReportsApi = {
  getReportsList: async () => {
    await delay();
    return [
      {
        id: '1',
        name: 'Monthly Sales Report',
        type: 'sales',
        lastGenerated: '2024-03-15',
        schedule: 'Monthly',
        status: 'completed',
        isNew: false
      },
      {
        id: '2',
        name: 'Customer Segmentation',
        type: 'customer',
        lastGenerated: '2024-03-14',
        schedule: null,
        status: 'completed',
        isNew: true
      }
    ];
  },
  getScheduledReports: async () => {
    await delay();
    return generateMockData().holidayComparison;
  }
}; 