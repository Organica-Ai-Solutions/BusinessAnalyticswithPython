// Mock data for testing
const mockData = {
  dashboard: {
    stats: [
      { title: 'Total Revenue', value: 124500, type: 'currency', change: 12.3 },
      { title: 'Orders', value: 856, type: 'number', change: -2.4 },
      { title: 'Customers', value: 432, type: 'number', change: 5.6 },
      { title: 'Conversion Rate', value: 3.2, type: 'percentage', change: 0.8 }
    ],
    salesChart: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [30500, 42000, 35800, 48000, 56000, 52000],
      forecast: [54000, 58000] // Forecast for next 2 months
    },
    categoryChart: {
      labels: ['Electronics', 'Clothing', 'Food', 'Books', 'Other'],
      data: [35, 25, 20, 15, 5],
      growth: [5.2, -1.3, 2.4, 3.1, 0.5] // Growth rate for each category
    },
    recentActivity: [
      {
        title: 'Large Order Received',
        description: 'New order #12345 worth $5,000 from Customer XYZ',
        time: '5 minutes ago',
        type: 'order'
      },
      {
        title: 'Low Stock Alert',
        description: 'Product ABC is running low on stock (5 units remaining)',
        time: '1 hour ago',
        type: 'inventory'
      },
      {
        title: 'New Customer Registration',
        description: 'Customer John Doe completed registration',
        time: '2 hours ago',
        type: 'customer'
      }
    ],
    topProducts: [
      { name: 'iPhone 13 Pro', category: 'Electronics', sales: 125, revenue: 156250, growth: 12.5 },
      { name: 'Nike Air Max', category: 'Clothing', sales: 89, revenue: 13350, growth: -2.3 },
      { name: 'Organic Coffee', category: 'Food', sales: 234, revenue: 7020, growth: 15.7 },
      { name: 'Best Seller Book', category: 'Books', sales: 156, revenue: 4680, growth: 5.2 },
      { name: 'Gaming Mouse', category: 'Electronics', sales: 98, revenue: 6860, growth: 8.9 }
    ],
    salesByRegion: {
      labels: ['North', 'South', 'East', 'West', 'Central'],
      data: [28500, 32400, 25600, 35200, 22100],
      growth: [4.5, 6.2, -1.8, 8.3, 2.1]
    }
  },
  analytics: {
    categories: ['Electronics', 'Clothing', 'Food', 'Books', 'Other'],
    trendData: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Revenue',
          data: [45000, 52000, 49000, 58000]
        },
        {
          label: 'Orders',
          data: [145, 165, 152, 178]
        }
      ]
    },
    customerSegments: [
      { segment: 'New', count: 124, growth: 15.3, avgOrderValue: 85 },
      { segment: 'Returning', count: 256, growth: 8.7, avgOrderValue: 120 },
      { segment: 'VIP', count: 52, growth: 3.2, avgOrderValue: 350 }
    ],
    productPerformance: {
      topSellers: [
        { name: 'iPhone 13 Pro', sales: 125, revenue: 156250, rating: 4.8 },
        { name: 'Nike Air Max', sales: 89, revenue: 13350, rating: 4.5 },
        { name: 'Organic Coffee', sales: 234, revenue: 7020, rating: 4.7 }
      ],
      lowStock: [
        { name: 'Gaming Mouse', current: 5, threshold: 20, daysToStockout: 3 },
        { name: 'Wireless Earbuds', current: 8, threshold: 25, daysToStockout: 5 },
        { name: 'Protein Bars', current: 15, threshold: 50, daysToStockout: 4 }
      ]
    }
  },
  reports: {
    reports: [
      {
        title: 'Sales Performance',
        description: 'Detailed analysis of sales trends and performance metrics',
        type: 'Sales',
        lastUpdated: '2024-03-15',
        metrics: ['Revenue', 'Units Sold', 'Average Order Value']
      },
      {
        title: 'Inventory Status',
        description: 'Current stock levels and inventory movement analysis',
        type: 'Inventory',
        lastUpdated: '2024-03-14',
        metrics: ['Stock Levels', 'Turnover Rate', 'Dead Stock']
      },
      {
        title: 'Customer Insights',
        description: 'Customer behavior and satisfaction metrics',
        type: 'Customer',
        lastUpdated: '2024-03-13',
        metrics: ['Satisfaction Score', 'Retention Rate', 'Lifetime Value']
      },
      {
        title: 'Financial Summary',
        description: 'Revenue, costs, and profit analysis',
        type: 'Finance',
        lastUpdated: '2024-03-15',
        metrics: ['Gross Margin', 'Operating Costs', 'Net Profit']
      },
      {
        title: 'Product Analytics',
        description: 'Product performance and category analysis',
        type: 'Product',
        lastUpdated: '2024-03-14',
        metrics: ['Category Performance', 'Product Rankings', 'Price Analysis']
      },
      {
        title: 'Marketing ROI',
        description: 'Marketing campaign performance and ROI metrics',
        type: 'Marketing',
        lastUpdated: '2024-03-12',
        metrics: ['Campaign Performance', 'Channel ROI', 'Customer Acquisition Cost']
      }
    ],
    exportFormats: ['PDF', 'Excel', 'CSV', 'JSON']
  }
};

// Mock API endpoints
export async function fetchMockData(endpoint) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Simulate API response
  switch (endpoint) {
    case '/dashboard':
      return mockData.dashboard;
    case '/analytics':
      return mockData.analytics;
    case '/reports':
      return mockData.reports;
    default:
      throw new Error('Endpoint not found');
  }
} 