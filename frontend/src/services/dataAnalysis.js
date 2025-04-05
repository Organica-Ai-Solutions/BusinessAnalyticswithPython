import {
  isValidArray,
  calculateGrowthRate,
  calculateAverage,
  detectSeasonality,
  calculateMovingAverage,
  aggregateByDimension,
  generateTimeSeriesData,
  formatMetric,
  calculateMedian,
  calculatePercentile
} from '../utils/dataProcessing';

// Data Analysis Service
export class DataAnalysisService {
  constructor() {
    this.cache = new Map();
  }

  // Calculate basic statistics
  calculateStats(data) {
    if (!Array.isArray(data) || data.length === 0) return null;
    
    const numbers = data.filter(n => typeof n === 'number' && !isNaN(n));
    if (numbers.length === 0) return null;

    return {
      mean: numbers.reduce((a, b) => a + b, 0) / numbers.length,
      median: this.calculateMedian(numbers),
      stdDev: this.calculateStdDev(numbers),
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      count: numbers.length
    };
  }

  // Calculate median
  calculateMedian(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }

  // Calculate standard deviation
  calculateStdDev(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squareDiffs = numbers.map(value => Math.pow(value - mean, 2));
    const variance = squareDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    return Math.sqrt(variance);
  }

  // Analyze sales trends
  analyzeSalesTrends(salesData) {
    if (!salesData || !Array.isArray(salesData.dates) || !Array.isArray(salesData.sales) || !Array.isArray(salesData.orders)) {
      console.error("Invalid sales data provided:", salesData);
      throw new Error('Invalid sales data for analysis');
    }

    // Check if arrays have matching lengths
    if (salesData.dates.length !== salesData.sales.length || salesData.dates.length !== salesData.orders.length) {
      console.error("Sales data arrays have mismatching lengths:", salesData);
      throw new Error('Sales data arrays have mismatching lengths');
    }
    
    if (salesData.dates.length === 0) {
      return { trend: 'No data', projection: 0 };
    }

    const data = salesData.dates.map((date, index) => ({
      date: new Date(date),
      sales: salesData.sales[index],
      orders: salesData.orders[index]
    }));

    // Sort data by date just in case it's not already sorted
    data.sort((a, b) => a.date - b.date);

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

  calculateVolatility(values) {
    if (!isValidArray(values)) return 0;
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      returns.push((values[i] - values[i-1]) / values[i-1]);
    }
    return Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length) * 100;
  }

  calculateStabilityScore(values) {
    if (!isValidArray(values)) return 0;
    const mean = calculateAverage(values);
    const deviations = values.map(v => Math.abs(v - mean) / mean);
    return 1 - (calculateAverage(deviations));
  }

  calculateTrendGrowth(values) {
    if (!isValidArray(values) || values.length < 2) return 0;
    const firstQuarter = values.slice(0, Math.floor(values.length / 4));
    const lastQuarter = values.slice(-Math.floor(values.length / 4));
    return calculateGrowthRate(
      calculateAverage(lastQuarter),
      calculateAverage(firstQuarter)
    );
  }

  identifySignificantPatterns(values) {
    if (!isValidArray(values)) return [];
    
    const patterns = [];
    const movingAvg = calculateMovingAverage(values, 7);
    
    // Identify trends
    const trendStrength = this.calculateTrendStrength(values);
    if (Math.abs(trendStrength) > 0.1) {
      patterns.push({
        type: trendStrength > 0 ? 'Upward Trend' : 'Downward Trend',
        strength: Math.abs(trendStrength),
        description: `${Math.abs(trendStrength * 100).toFixed(1)}% ${trendStrength > 0 ? 'increase' : 'decrease'} over period`
      });
    }

    // Identify cycles
    const cycles = this.identifyCycles(values);
    patterns.push(...cycles);

    // Identify outliers
    const outliers = this.identifyOutliers(values, movingAvg);
    if (outliers.length > 0) {
      patterns.push({
        type: 'Outliers',
        strength: outliers.length / values.length,
        description: `${outliers.length} significant deviations detected`
      });
    }

    return patterns;
  }

  identifyCycles(values) {
    const cycles = [];
    const correlations = [];
    
    // Check for various cycle lengths
    [7, 14, 30, 90].forEach(period => {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < values.length - period; i++) {
        const slice1 = values.slice(i, i + period);
        const slice2 = values.slice(i + period, i + 2 * period);
        if (slice2.length === period) {
          correlation += this.calculateCorrelation(slice1, slice2);
          count++;
        }
      }
      
      if (count > 0) {
        correlations.push({
          period,
          correlation: correlation / count
        });
      }
    });

    // Identify significant cycles
    correlations
      .filter(c => Math.abs(c.correlation) > 0.5)
      .forEach(c => {
        cycles.push({
          type: 'Cyclical Pattern',
          strength: Math.abs(c.correlation),
          description: `${c.period}-day cycle detected (${(c.correlation * 100).toFixed(1)}% correlation)`
        });
      });

    return cycles;
  }

  identifyOutliers(values, movingAvg) {
    const outliers = [];
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - calculateAverage(values), 2), 0) / values.length
    );
    
    values.forEach((val, i) => {
      if (Math.abs(val - movingAvg[i]) > 2 * stdDev) {
        outliers.push({
          index: i,
          value: val,
          deviation: (val - movingAvg[i]) / movingAvg[i]
        });
      }
    });

    return outliers;
  }

  calculateCorrelation(array1, array2) {
    if (array1.length !== array2.length) return 0;
    
    const mean1 = calculateAverage(array1);
    const mean2 = calculateAverage(array2);
    
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < array1.length; i++) {
      const diff1 = array1[i] - mean1;
      const diff2 = array2[i] - mean2;
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }
    
    if (denominator1 === 0 || denominator2 === 0) return 0;
    return numerator / Math.sqrt(denominator1 * denominator2);
  }

  calculateTrendStrength(values) {
    if (!isValidArray(values) || values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = values;
    
    const meanX = calculateAverage(x);
    const meanY = calculateAverage(y);
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += Math.pow(x[i] - meanX, 2);
    }
    
    if (denominator === 0) return 0;
    const slope = numerator / denominator;
    
    // Normalize the trend strength to be between -1 and 1
    return Math.tanh(slope * n / (Math.max(...y) - Math.min(...y)));
  }

  // Calculate growth rate
  calculateGrowthRate(data) {
    if (!Array.isArray(data) || data.length < 2) return null;

    const periods = [];
    for (let i = 1; i < data.length; i++) {
      const previousValue = data[i - 1];
      const currentValue = data[i];
      if (previousValue !== 0) {
        const growthRate = ((currentValue - previousValue) / previousValue) * 100;
        periods.push(growthRate);
      }
    }

    return {
      periodic: periods,
      average: this.calculateStats(periods)?.mean || 0
    };
  }

  // Detect seasonality in data
  detectSeasonality(data, period = 'weekly') {
    if (!Array.isArray(data) || data.length < 52) {
      return {
        hasSeasonality: false,
        strength: 0,
        patterns: [],
        peakPeriods: [],
        troughPeriods: [],
        seasonalityScore: 0,
        seasonalComponents: null,
        cyclicalPatterns: []
      };
    }

    const periodsMap = {
      weekly: 52,
      monthly: 12,
      quarterly: 4
    };

    const periodLength = periodsMap[period] || 52;
    
    // Calculate moving averages for trend removal
    const movingAvg = this.calculateMovingAverage(data, Math.min(periodLength, 12));
    
    // Remove trend to get seasonal variations
    const detrended = data.map((val, i) => val - (movingAvg[i] || val));
    
    // Calculate seasonal indices
    const seasonalIndices = [];
    for (let i = 0; i < periodLength; i++) {
      const periodValues = [];
      for (let j = i; j < data.length; j += periodLength) {
        if (detrended[j] !== undefined) {
          periodValues.push(detrended[j]);
        }
      }
      if (periodValues.length > 0) {
        const avgIndex = periodValues.reduce((a, b) => a + b, 0) / periodValues.length;
        seasonalIndices.push({
          period: i + 1,
          index: avgIndex,
          strength: Math.abs(avgIndex) / (Math.max(...data) - Math.min(...data))
        });
      }
    }

    // Calculate autocorrelation for different lags
    const correlations = [];
    for (let lag = 1; lag <= Math.min(periodLength, Math.floor(data.length / 3)); lag++) {
      const correlation = this.calculateCorrelation(
        detrended.slice(0, -lag),
        detrended.slice(lag)
      );
      correlations.push({ lag, correlation: correlation || 0 });
    }

    // Find significant correlations and patterns
    const significantCorrelations = correlations.filter(c => Math.abs(c.correlation) > 0.3);
    
    // Detect peaks and troughs
    const peaks = [];
    const troughs = [];
    const windowSize = Math.min(periodLength, 12);
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      const window = data.slice(i - windowSize, i + windowSize + 1);
      const currentValue = data[i];
      const localMax = Math.max(...window);
      const localMin = Math.min(...window);
      
      if (currentValue === localMax && currentValue > movingAvg[i] * 1.1) {
        peaks.push({
          index: i,
          value: currentValue,
          percentageAboveAverage: ((currentValue - movingAvg[i]) / movingAvg[i] * 100).toFixed(1),
          confidence: (currentValue - movingAvg[i]) / (Math.max(...data) - Math.min(...data))
        });
      }
      
      if (currentValue === localMin && currentValue < movingAvg[i] * 0.9) {
        troughs.push({
          index: i,
          value: currentValue,
          percentageBelowAverage: ((movingAvg[i] - currentValue) / movingAvg[i] * 100).toFixed(1),
          confidence: (movingAvg[i] - currentValue) / (Math.max(...data) - Math.min(...data))
        });
      }
    }

    // Calculate overall seasonality strength
    const seasonalityStrength = Math.max(
      ...seasonalIndices.map(s => s.strength),
      ...significantCorrelations.map(c => Math.abs(c.correlation))
    );

    // Identify cyclical patterns
    const cyclicalPatterns = this.identifyCyclicalPatterns(detrended, periodLength);

    // Calculate seasonal components
    const seasonalComponents = {
      trend: movingAvg,
      seasonal: detrended,
      indices: seasonalIndices,
      periodicity: this.detectPeriodicity(correlations)
    };

    return {
      hasSeasonality: seasonalityStrength > 0.3,
      strength: seasonalityStrength,
      seasonalityScore: (seasonalityStrength * 100).toFixed(1),
      patterns: seasonalIndices.map(s => ({
        period: s.period,
        effect: s.index,
        strength: s.strength,
        isSignificant: Math.abs(s.strength) > 0.2
      })),
      peakPeriods: peaks.sort((a, b) => b.confidence - a.confidence),
      troughPeriods: troughs.sort((a, b) => b.confidence - a.confidence),
      seasonalComponents,
      cyclicalPatterns,
      correlations: significantCorrelations
    };
  }

  // Identify cyclical patterns
  identifyCyclicalPatterns(detrended, periodLength) {
    const patterns = [];
    const minPatternLength = Math.floor(periodLength / 4);
    
    for (let length = minPatternLength; length <= periodLength; length++) {
      const patternStrength = this.calculatePatternStrength(detrended, length);
      if (patternStrength > 0.3) {
        patterns.push({
          length,
          strength: patternStrength,
          description: this.describePattern(length, periodLength)
        });
      }
    }
    
    return patterns.sort((a, b) => b.strength - a.strength);
  }

  // Calculate pattern strength
  calculatePatternStrength(data, patternLength) {
    const patterns = [];
    for (let i = 0; i < data.length - patternLength; i += patternLength) {
      patterns.push(data.slice(i, i + patternLength));
    }
    
    if (patterns.length < 2) return 0;
    
    let totalCorrelation = 0;
    let correlationCount = 0;
    
    for (let i = 0; i < patterns.length - 1; i++) {
      const correlation = this.calculateCorrelation(patterns[i], patterns[i + 1]);
      if (correlation !== null) {
        totalCorrelation += Math.abs(correlation);
        correlationCount++;
      }
    }
    
    return correlationCount > 0 ? totalCorrelation / correlationCount : 0;
  }

  // Describe pattern based on length
  describePattern(length, periodLength) {
    if (length === periodLength) return 'Annual cycle';
    if (length === Math.floor(periodLength / 2)) return 'Semi-annual cycle';
    if (length === Math.floor(periodLength / 4)) return 'Quarterly cycle';
    if (length === Math.floor(periodLength / 12)) return 'Monthly cycle';
    return `${length}-period cycle`;
  }

  // Detect periodicity from correlations
  detectPeriodicity(correlations) {
    const significantPeaks = [];
    for (let i = 1; i < correlations.length - 1; i++) {
      if (correlations[i].correlation > correlations[i-1].correlation &&
          correlations[i].correlation > correlations[i+1].correlation &&
          correlations[i].correlation > 0.3) {
        significantPeaks.push({
          lag: correlations[i].lag,
          strength: correlations[i].correlation
        });
      }
    }
    return significantPeaks.sort((a, b) => b.strength - a.strength);
  }

  // Calculate moving average
  calculateMovingAverage(data, window) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(data.length, i + Math.floor(window / 2) + 1);
      const windowData = data.slice(start, end);
      result[i] = windowData.reduce((a, b) => a + b, 0) / windowData.length;
    }
    return result;
  }

  // Generate forecast using simple moving average
  generateForecast(data, period = 'weekly') {
    const windowSizes = {
      weekly: 4,
      monthly: 3,
      quarterly: 2
    };

    const windowSize = windowSizes[period] || 4;
    const forecast = [];

    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i);
      const prediction = window.reduce((a, b) => a + b, 0) / windowSize;
      forecast.push(prediction);
    }

    return {
      predictions: forecast,
      confidence: this.calculateForecastConfidence(data, forecast, windowSize)
    };
  }

  // Calculate forecast confidence
  calculateForecastConfidence(actual, forecast, windowSize) {
    const errors = [];
    for (let i = 0; i < forecast.length; i++) {
      const actualIndex = i + windowSize;
      const error = Math.abs((actual[actualIndex] - forecast[i]) / actual[actualIndex]) * 100;
      errors.push(error);
    }

    return {
      mape: this.calculateStats(errors)?.mean || 0,
      errorRange: {
        min: Math.min(...errors),
        max: Math.max(...errors)
      }
    };
  }

  // Analyze store performance
  analyzeStorePerformance(storeData) {
    const cacheKey = 'storePerformance';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const performance = {
      byType: this.aggregateByStoreType(storeData),
      efficiency: this.calculateStoreEfficiency(storeData),
      rankings: this.rankStores(storeData),
      recommendations: this.generateRecommendations(storeData)
    };

    this.cache.set(cacheKey, performance);
    return performance;
  }

  // Aggregate data by store type
  aggregateByStoreType(storeData) {
    const types = {};
    
    storeData.forEach(store => {
      if (!types[store.Type]) {
        types[store.Type] = {
          count: 0,
          totalSales: 0,
          avgWeeklySales: 0,
          salesPerSqFt: [],
          efficiency: []
        };
      }
      
      types[store.Type].count++;
      types[store.Type].totalSales += store.total_sales;
      types[store.Type].avgWeeklySales += store.avg_weekly_sales;
      types[store.Type].salesPerSqFt.push(store.sales_per_sqft);
      types[store.Type].efficiency.push(store.efficiency || 0);
    });

    // Calculate averages
    Object.values(types).forEach(type => {
      type.avgWeeklySales /= type.count;
      type.avgSalesPerSqFt = this.calculateStats(type.salesPerSqFt)?.mean || 0;
      type.avgEfficiency = this.calculateStats(type.efficiency)?.mean || 0;
    });

    return types;
  }

  // Calculate store efficiency metrics
  calculateStoreEfficiency(storeData) {
    return storeData.map(store => ({
      id: store.Store,
      type: store.Type,
      salesEfficiency: store.sales_per_sqft / (this.getIndustryAverage(store.Type) || 1),
      spaceUtilization: store.total_sales / (store.Size || 1),
      performanceScore: this.calculatePerformanceScore(store)
    }));
  }

  // Get industry average (placeholder)
  getIndustryAverage(storeType) {
    const averages = {
      A: 250,
      B: 200,
      C: 150
    };
    return averages[storeType] || 200;
  }

  // Calculate overall performance score
  calculatePerformanceScore(store) {
    const weights = {
      salesPerSqFt: 0.4,
      avgWeeklySales: 0.3,
      efficiency: 0.3
    };

    const metrics = {
      salesPerSqFt: store.sales_per_sqft / (this.getIndustryAverage(store.Type) || 1),
      avgWeeklySales: store.avg_weekly_sales / (this.getIndustryAverage(store.Type) * store.Size || 1),
      efficiency: store.efficiency || 0
    };

    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (metrics[metric] * weight);
    }, 0);
  }

  // Rank stores by various metrics
  rankStores(storeData) {
    const metrics = ['total_sales', 'avg_weekly_sales', 'sales_per_sqft', 'efficiency'];
    const rankings = {};

    metrics.forEach(metric => {
      rankings[metric] = [...storeData]
        .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
        .map((store, index) => ({
          id: store.Store,
          rank: index + 1,
          value: store[metric] || 0
        }));
    });

    return rankings;
  }

  // Generate performance recommendations
  generateRecommendations(storeData) {
    const recommendations = [];
    const storeEfficiency = this.calculateStoreEfficiency(storeData);

    storeEfficiency.forEach(store => {
      if (store.salesEfficiency < 0.8) {
        recommendations.push({
          storeId: store.id,
          type: 'improvement',
          priority: 'high',
          message: `Store ${store.id} shows below-average sales efficiency. Consider reviewing store layout and marketing strategies.`
        });
      }

      if (store.spaceUtilization < 0.7) {
        recommendations.push({
          storeId: store.id,
          type: 'optimization',
          priority: 'medium',
          message: `Store ${store.id} has low space utilization. Consider optimizing store layout or reducing unused space.`
        });
      }

      if (store.performanceScore > 1.2) {
        recommendations.push({
          storeId: store.id,
          type: 'expansion',
          priority: 'low',
          message: `Store ${store.id} is performing exceptionally well. Consider implementing successful strategies in other locations.`
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    });
  }

  // Clear analysis cache
  clearCache() {
    this.cache.clear();
  }

  getCacheKey(method, params = {}) {
    return `${method}_${JSON.stringify(params)}`;
  }

  async analyzeProductPerformance(salesData) {
    const cacheKey = this.getCacheKey('analyzeProductPerformance');
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const productMetrics = aggregateByDimension(salesData, 'product', {
        totalSales: 'sum',
        quantity: 'sum',
        profit: 'sum'
      });

      const result = productMetrics.map(product => ({
        productId: product.product,
        metrics: {
          averageSales: formatMetric(product.totalSales / product.count, 'currency'),
          totalQuantity: formatMetric(product.quantity, 'number'),
          profitMargin: formatMetric((product.profit / product.totalSales) * 100, 'percent')
        }
      }));

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error analyzing product performance:', error);
      throw error;
    }
  }

  async analyzeRegionalPerformance(salesData) {
    const cacheKey = this.getCacheKey('analyzeRegionalPerformance');
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const regionalMetrics = aggregateByDimension(salesData, 'region', {
        totalSales: 'sum',
        profit: 'sum',
        orders: 'count'
      });

      const result = regionalMetrics.map(region => ({
        region: region.region,
        metrics: {
          totalSales: formatMetric(region.totalSales, 'currency'),
          profitability: formatMetric((region.profit / region.totalSales) * 100, 'percent'),
          orderCount: formatMetric(region.orders, 'number')
        }
      }));

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error analyzing regional performance:', error);
      throw error;
    }
  }

  async analyzeInventoryMetrics(inventoryData) {
    const cacheKey = this.getCacheKey('analyzeInventoryMetrics');
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const result = inventoryData.map(item => ({
        productId: item.productId,
        metrics: {
          currentStock: formatMetric(item.currentStock, 'number'),
          daysUntilReorder: formatMetric(this.calculateDaysUntilReorder(item), 'number'),
          averageLeadTime: formatMetric(item.averageLeadTime, 'number')
        }
      }));

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error analyzing inventory metrics:', error);
      throw error;
    }
  }

  calculateDaysUntilReorder(item) {
    const dailyUsage = item.averageDailyUsage || 1;
    const buffer = item.safetyStock || 0;
    return Math.floor((item.currentStock - buffer) / dailyUsage);
  }
}

// Export a singleton instance
export const dataAnalysis = new DataAnalysisService(); 