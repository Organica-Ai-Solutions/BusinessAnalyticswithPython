import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';
import { DataAnalysisService } from '../services/dataAnalysis';

const AnalyticsDashboard = ({ salesData }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const salesChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const dataAnalysis = new DataAnalysisService();

  useEffect(() => {
    const analyzeSales = async () => {
      try {
        setLoading(true);
        const results = await dataAnalysis.analyzeSalesTrends(salesData);
        setAnalytics(results);
        setError(null);
      } catch (err) {
        setError('Failed to analyze sales data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (salesData) {
      analyzeSales();
    }
  }, [salesData]);

  useEffect(() => {
    if (!analytics || !salesChartRef.current || !trendChartRef.current) return;

    // Destroy existing charts
    const salesCtx = salesChartRef.current.getContext('2d');
    const trendCtx = trendChartRef.current.getContext('2d');
    
    if (salesChartRef.current.chart) {
      salesChartRef.current.chart.destroy();
    }
    if (trendChartRef.current.chart) {
      trendChartRef.current.chart.destroy();
    }

    // Create sales chart
    salesChartRef.current.chart = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: analytics.timeSeriesData.map(d => d.date),
        datasets: [
          {
            label: 'Sales',
            data: analytics.timeSeriesData.map(d => d.value),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          },
          {
            label: 'Short-term Trend (7-day)',
            data: analytics.trends.shortTerm,
            borderColor: 'rgba(255, 99, 132, 0.8)',
            borderDash: [5, 5],
            fill: false
          },
          {
            label: 'Long-term Trend (90-day)',
            data: analytics.trends.longTerm,
            borderColor: 'rgba(54, 162, 235, 0.8)',
            borderDash: [10, 10],
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Sales Trends Analysis'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Sales Amount'
            }
          }
        }
      }
    });

    // Create pattern strength chart
    trendChartRef.current.chart = new Chart(trendCtx, {
      type: 'radar',
      data: {
        labels: analytics.patterns.map(p => p.type),
        datasets: [{
          label: 'Pattern Strength',
          data: analytics.patterns.map(p => p.strength * 100),
          fill: true,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235)',
          pointBackgroundColor: 'rgb(54, 162, 235)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(54, 162, 235)'
        }]
      },
      options: {
        elements: {
          line: {
            borderWidth: 3
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Pattern Analysis'
          }
        }
      }
    });
  }, [analytics]);

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!analytics) {
    return <div>No data available</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Sales Performance</h3>
          <div className="metric-value">{analytics.metrics.averageSales}</div>
          <div className="metric-label">Average Sales</div>
          <div className="metric-growth">
            {analytics.metrics.growthRate} growth
          </div>
        </div>
        
        <div className="metric-card">
          <h3>Year over Year</h3>
          <div className="metric-value">{analytics.metrics.yearOverYear}</div>
          <div className="metric-label">YoY Growth</div>
        </div>

        <div className="metric-card">
          <h3>Stability Metrics</h3>
          <div className="metric-value">{analytics.metrics.stabilityScore}</div>
          <div className="metric-label">Stability Score</div>
          <div className="metric-subtitle">
            Volatility: {analytics.metrics.volatility}
          </div>
        </div>

        <div className="metric-card">
          <h3>Distribution</h3>
          <div className="metric-value">{analytics.metrics.medianSales}</div>
          <div className="metric-label">Median Sales</div>
          <div className="metric-range">
            {analytics.metrics.lowerQuartile} - {analytics.metrics.upperQuartile}
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <canvas ref={salesChartRef}></canvas>
        </div>
        <div className="chart-wrapper">
          <canvas ref={trendChartRef}></canvas>
        </div>
      </div>

      <div className="patterns-section">
        <h3>Detected Patterns</h3>
        <div className="patterns-grid">
          {analytics.patterns.map((pattern, index) => (
            <div key={index} className="pattern-card">
              <h4>{pattern.type}</h4>
              <div className="pattern-strength">
                Strength: {(pattern.strength * 100).toFixed(1)}%
              </div>
              <div className="pattern-description">
                {pattern.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {analytics.metrics.seasonality && (
        <div className="seasonality-section">
          <h3>Seasonality Analysis</h3>
          <div className="seasonality-details">
            <div className="seasonality-strength">
              Strength: {(analytics.metrics.seasonality.strength * 100).toFixed(1)}%
            </div>
            <div className="seasonality-period">
              Primary Period: {analytics.metrics.seasonality.primaryPeriod} days
            </div>
            {analytics.metrics.seasonality.peaks && (
              <div className="seasonality-peaks">
                Peak Periods: {analytics.metrics.seasonality.peaks.join(', ')}
              </div>
            )}
            {analytics.metrics.seasonality.troughs && (
              <div className="seasonality-troughs">
                Trough Periods: {analytics.metrics.seasonality.troughs.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 