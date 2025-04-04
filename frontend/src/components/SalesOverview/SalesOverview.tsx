import { useEffect, useRef } from 'react';
import { SalesSummary } from '../../services/retailDataService';
import Chart from 'chart.js/auto';
import './SalesOverview.css';

interface SalesOverviewProps {
  salesSummary: SalesSummary;
}

const SalesOverview: React.FC<SalesOverviewProps> = ({ salesSummary }) => {
  const monthlySalesChartRef = useRef<HTMLCanvasElement | null>(null);
  const departmentSalesChartRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    if (!salesSummary) return;

    // Monthly sales chart
    let monthlySalesChart: Chart | null = null;
    if (monthlySalesChartRef.current) {
      const ctx = monthlySalesChartRef.current.getContext('2d');
      if (ctx) {
        monthlySalesChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: salesSummary.monthlySales.map(item => item.month),
            datasets: [{
              label: 'Monthly Sales',
              data: salesSummary.monthlySales.map(item => item.sales),
              borderColor: '#3498db',
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `$${context.parsed.y.toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                ticks: {
                  callback: function(value) {
                    return '$' + Number(value).toLocaleString();
                  }
                }
              }
            }
          }
        });
      }
    }

    // Department sales chart
    let departmentSalesChart: Chart | null = null;
    if (departmentSalesChartRef.current) {
      const ctx = departmentSalesChartRef.current.getContext('2d');
      if (ctx) {
        departmentSalesChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: salesSummary.topDepartments.map(item => `Dept ${item.Dept}`),
            datasets: [{
              label: 'Department Sales',
              data: salesSummary.topDepartments.map(item => item.Sales),
              backgroundColor: [
                'rgba(52, 152, 219, 0.7)',
                'rgba(155, 89, 182, 0.7)',
                'rgba(46, 204, 113, 0.7)',
                'rgba(241, 196, 15, 0.7)',
                'rgba(231, 76, 60, 0.7)'
              ],
              borderColor: [
                'rgba(52, 152, 219, 1)',
                'rgba(155, 89, 182, 1)',
                'rgba(46, 204, 113, 1)',
                'rgba(241, 196, 15, 1)',
                'rgba(231, 76, 60, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `$${context.parsed.y.toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '$' + Number(value).toLocaleString();
                  }
                }
              }
            }
          }
        });
      }
    }

    return () => {
      monthlySalesChart?.destroy();
      departmentSalesChart?.destroy();
    };
  }, [salesSummary]);

  return (
    <div className="sales-overview">
      <div className="chart-row">
        <div className="chart-item">
          <h3>Monthly Sales Trend</h3>
          <div className="chart-wrapper">
            <canvas ref={monthlySalesChartRef}></canvas>
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-item">
          <h3>Top Performing Departments</h3>
          <div className="chart-wrapper">
            <canvas ref={departmentSalesChartRef}></canvas>
          </div>
        </div>
      </div>

      <div className="sales-highlights">
        <div className="highlight-item">
          <h4>Holiday vs Non-Holiday</h4>
          <div className="highlight-stats">
            <div className="stat">
              <span className="stat-label">Holiday:</span>
              <span className="stat-value">${salesSummary.holidaySales.holidayAvg.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Non-Holiday:</span>
              <span className="stat-value">${salesSummary.holidaySales.nonHolidayAvg.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Difference:</span>
              <span className="stat-value">+{salesSummary.holidaySales.percentageIncrease.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOverview; 