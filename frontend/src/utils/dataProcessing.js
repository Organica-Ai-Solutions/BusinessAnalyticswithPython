import { formatCurrency, formatNumber, formatPercent } from '../config';

// Data validation functions
export const isValidNumber = (value) => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

export const isValidDate = (value) => {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date);
};

export const isValidArray = (value) => {
  return Array.isArray(value) && value.length > 0;
};

// Data processing functions
export const calculateGrowthRate = (current, previous) => {
  if (!isValidNumber(current) || !isValidNumber(previous) || previous === 0) {
    return 0;
  }
  return ((current - previous) / previous) * 100;
};

export const calculateAverage = (values) => {
  if (!isValidArray(values)) return 0;
  const numbers = values.filter(isValidNumber);
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
};

export const calculateMedian = (values) => {
  if (!isValidArray(values)) return 0;
  const numbers = values.filter(isValidNumber).sort((a, b) => a - b);
  if (numbers.length === 0) return 0;
  const mid = Math.floor(numbers.length / 2);
  return numbers.length % 2 === 0 ? (numbers[mid - 1] + numbers[mid]) / 2 : numbers[mid];
};

export const calculatePercentile = (values, percentile) => {
  if (!isValidArray(values) || !isValidNumber(percentile) || percentile < 0 || percentile > 100) {
    return 0;
  }
  const numbers = values.filter(isValidNumber).sort((a, b) => a - b);
  if (numbers.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * numbers.length) - 1;
  return numbers[index];
};

// Time series analysis
export const detectSeasonality = (data, period = 52) => {
  if (!isValidArray(data) || data.length < period * 2) {
    return {
      hasSeasonality: false,
      strength: 0,
      patterns: []
    };
  }

  // Calculate moving average to remove trend
  const ma = calculateMovingAverage(data, period);
  
  // Remove trend from data
  const detrended = data.map((val, i) => val - (ma[i] || val));
  
  // Calculate autocorrelation for different lags
  const correlations = [];
  for (let lag = 1; lag <= Math.min(period, Math.floor(data.length / 3)); lag++) {
    correlations.push({
      lag,
      correlation: calculateCorrelation(
        detrended.slice(0, -lag),
        detrended.slice(lag)
      )
    });
  }

  // Find significant correlations
  const significantCorrelations = correlations.filter(c => Math.abs(c.correlation) > 0.3);
  
  // Calculate seasonality strength
  const seasonalityStrength = significantCorrelations.length > 0 ?
    Math.max(...significantCorrelations.map(c => Math.abs(c.correlation))) : 0;

  return {
    hasSeasonality: seasonalityStrength > 0.3,
    strength: seasonalityStrength,
    patterns: identifyPatterns(detrended, period)
  };
};

export const calculateMovingAverage = (data, window) => {
  if (!isValidArray(data) || !isValidNumber(window) || window < 1) {
    return [];
  }

  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(data.length, i + Math.floor(window / 2) + 1);
    const windowData = data.slice(start, end);
    result[i] = calculateAverage(windowData);
  }
  return result;
};

export const calculateCorrelation = (x, y) => {
  if (!isValidArray(x) || !isValidArray(y) || x.length !== y.length) {
    return 0;
  }

  const n = x.length;
  const meanX = calculateAverage(x);
  const meanY = calculateAverage(y);
  
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denominatorX += diffX * diffX;
    denominatorY += diffY * diffY;
  }
  
  if (denominatorX === 0 || denominatorY === 0) return 0;
  return numerator / Math.sqrt(denominatorX * denominatorY);
};

export const identifyPatterns = (data, period) => {
  if (!isValidArray(data) || !isValidNumber(period)) {
    return [];
  }

  const patterns = [];
  const minPatternLength = Math.floor(period / 4);
  
  for (let length = minPatternLength; length <= period; length++) {
    const patternStrength = calculatePatternStrength(data, length);
    if (patternStrength > 0.3) {
      patterns.push({
        length,
        strength: patternStrength,
        description: getPatternDescription(length, period)
      });
    }
  }
  
  return patterns.sort((a, b) => b.strength - a.strength);
};

export const calculatePatternStrength = (data, patternLength) => {
  if (!isValidArray(data) || !isValidNumber(patternLength)) {
    return 0;
  }

  const patterns = [];
  for (let i = 0; i < data.length - patternLength; i += patternLength) {
    patterns.push(data.slice(i, i + patternLength));
  }
  
  if (patterns.length < 2) return 0;
  
  let totalCorrelation = 0;
  let correlationCount = 0;
  
  for (let i = 0; i < patterns.length - 1; i++) {
    const correlation = calculateCorrelation(patterns[i], patterns[i + 1]);
    if (correlation !== null) {
      totalCorrelation += Math.abs(correlation);
      correlationCount++;
    }
  }
  
  return correlationCount > 0 ? totalCorrelation / correlationCount : 0;
};

export const getPatternDescription = (length, period) => {
  if (length === period) return 'Annual cycle';
  if (length === Math.floor(period / 2)) return 'Semi-annual cycle';
  if (length === Math.floor(period / 4)) return 'Quarterly cycle';
  if (length === Math.floor(period / 12)) return 'Monthly cycle';
  return `${length}-period cycle`;
};

// Data aggregation functions
export const aggregateByDimension = (data, dimension, metrics) => {
  if (!isValidArray(data) || !dimension || !metrics) {
    return [];
  }

  const aggregated = data.reduce((acc, item) => {
    const key = item[dimension];
    if (!acc[key]) {
      acc[key] = {
        [dimension]: key,
        count: 0
      };
      // Initialize metrics
      Object.keys(metrics).forEach(metric => {
        acc[key][metric] = 0;
      });
    }

    acc[key].count++;
    // Update metrics based on aggregation type
    Object.entries(metrics).forEach(([metric, type]) => {
      switch (type) {
        case 'sum':
          acc[key][metric] += (item[metric] || 0);
          break;
        case 'avg':
          acc[key][metric] = (acc[key][metric] * (acc[key].count - 1) + (item[metric] || 0)) / acc[key].count;
          break;
        case 'max':
          acc[key][metric] = Math.max(acc[key][metric], item[metric] || 0);
          break;
        case 'min':
          acc[key][metric] = Math.min(acc[key][metric], item[metric] || 0);
          break;
        case 'count':
          acc[key][metric]++;
          break;
      }
    });

    return acc;
  }, {});

  return Object.values(aggregated);
};

// Data formatting functions
export const formatMetric = (value, type) => {
  if (!isValidNumber(value)) return '0';
  
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'number':
      return formatNumber(value);
    default:
      return value.toString();
  }
};

export const formatDimension = (value, type) => {
  if (value === null || value === undefined) return 'Unknown';
  
  switch (type) {
    case 'date':
      return isValidDate(value) ? new Date(value).toLocaleDateString() : 'Invalid Date';
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return value.toString();
  }
};

// Export helper functions
export const generateTimeSeriesData = (data, dateField, valueField, interval = 'day') => {
  if (!isValidArray(data) || !dateField || !valueField) {
    return [];
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]));

  // Group by interval
  const groupedData = sortedData.reduce((acc, item) => {
    const date = new Date(item[dateField]);
    let key;

    switch (interval) {
      case 'week':
        // Get the Monday of the week
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        key = new Date(date.setDate(diff)).toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      default: // day
        key = date.toISOString().split('T')[0];
    }

    if (!acc[key]) {
      acc[key] = {
        date: key,
        value: 0,
        count: 0
      };
    }

    acc[key].value += item[valueField] || 0;
    acc[key].count++;

    return acc;
  }, {});

  // Convert to array and calculate averages if needed
  return Object.values(groupedData).map(item => ({
    date: item.date,
    value: interval === 'day' ? item.value : item.value / item.count
  }));
}; 