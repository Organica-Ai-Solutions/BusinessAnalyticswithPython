import { useEffect, useRef } from 'react';
import { StoreTypeSummary } from '../../services/retailDataService';
import Chart from 'chart.js/auto';
import './StorePerformance.css';

interface StorePerformanceProps {
  storeTypeSummary: StoreTypeSummary[];
}

const StorePerformance: React.FC<StorePerformanceProps> = ({ storeTypeSummary }) => {
  const salesByTypeChartRef = useRef<HTMLCanvasElement | null>(null);
  const sizeComparisonChartRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    if (!storeTypeSummary || storeTypeSummary.length === 0) return;

    // Sales by store type chart
    let salesByTypeChart: Chart | null = null;
    if (salesByTypeChartRef.current) {
      const ctx = salesByTypeChartRef.current.getContext('2d');
      if (ctx) {
        salesByTypeChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: storeTypeSummary.map(store => `Type ${store.type}`),
            datasets: [{
              data: storeTypeSummary.map(store => store.totalSales),
              backgroundColor: [
                'rgba(52, 152, 219, 0.7)',
                'rgba(46, 204, 113, 0.7)',
                'rgba(155, 89, 182, 0.7)'
              ],
              borderColor: [
                'rgba(52, 152, 219, 1)',
                'rgba(46, 204, 113, 1)',
                'rgba(155, 89, 182, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  padding: 20
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw as number;
                    const total = context.dataset.data.reduce((acc: number, curr: number) => acc + curr, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `$${value.toLocaleString()} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }

    // Store size comparison chart
    let sizeComparisonChart: Chart | null = null;
    if (sizeComparisonChartRef.current) {
      const ctx = sizeComparisonChartRef.current.getContext('2d');
      if (ctx) {
        sizeComparisonChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: storeTypeSummary.map(store => `Type ${store.type}`),
            datasets: [
              {
                label: 'Avg Store Size (sq ft)',
                data: storeTypeSummary.map(store => store.avgSize),
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1,
                order: 2
              },
              {
                label: 'Sales per sq ft',
                data: storeTypeSummary.map(store => store.salesPerSqFt),
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                type: 'line',
                yAxisID: 'y1',
                order: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    if (context.dataset.label === 'Avg Store Size (sq ft)') {
                      return `${context.dataset.label}: ${context.raw.toLocaleString()} sq ft`;
                    } else {
                      return `${context.dataset.label}: $${context.raw.toLocaleString()}/sq ft`;
                    }
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return Number(value).toLocaleString();
                  }
                },
                title: {
                  display: true,
                  text: 'Avg Size (sq ft)'
                }
              },
              y1: {
                beginAtZero: true,
                position: 'right',
                grid: {
                  drawOnChartArea: false
                },
                ticks: {
                  callback: function(value) {
                    return '$' + Number(value).toLocaleString();
                  }
                },
                title: {
                  display: true,
                  text: 'Sales per sq ft ($)'
                }
              }
            }
          }
        });
      }
    }

    return () => {
      salesByTypeChart?.destroy();
      sizeComparisonChart?.destroy();
    };
  }, [storeTypeSummary]);

  return (
    <div className="store-performance">
      <div className="chart-row">
        <div className="chart-item">
          <h3>Sales by Store Type</h3>
          <div className="chart-wrapper">
            <canvas ref={salesByTypeChartRef}></canvas>
          </div>
        </div>
      </div>
      
      <div className="chart-row">
        <div className="chart-item">
          <h3>Store Size vs. Sales Efficiency</h3>
          <div className="chart-wrapper">
            <canvas ref={sizeComparisonChartRef}></canvas>
          </div>
        </div>
      </div>

      <div className="performance-table">
        <h3>Store Type Performance</h3>
        <table>
          <thead>
            <tr>
              <th>Store Type</th>
              <th>Stores</th>
              <th>Avg Weekly Sales</th>
              <th>Avg Size</th>
              <th>Sales/sq ft</th>
            </tr>
          </thead>
          <tbody>
            {storeTypeSummary.map((store, index) => (
              <tr key={index}>
                <td>Type {store.type}</td>
                <td>{store.count}</td>
                <td>${store.avgWeeklySales.toLocaleString()}</td>
                <td>{store.avgSize.toLocaleString()} sq ft</td>
                <td>${store.salesPerSqFt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StorePerformance; 