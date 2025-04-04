import { useState, useEffect } from 'react';
import { SalesSummary, StoreTypeSummary } from '../../services/retailDataService';
import retailDataService from '../../services/retailDataService';
import SalesOverview from '../SalesOverview/SalesOverview';
import StorePerformance from '../StorePerformance/StorePerformance';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [storeTypeSummary, setStoreTypeSummary] = useState<StoreTypeSummary[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch sales summary data
        const salesData = await retailDataService.getSalesSummary();
        setSalesSummary(salesData);

        // Fetch store type summary data
        const storeTypeData = await retailDataService.getStoreTypeSummary();
        setStoreTypeSummary(storeTypeData);
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading retail analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Retail Analytics Dashboard</h1>
        <p>Comprehensive analysis for data-driven decision-making</p>
      </header>

      <div className="dashboard-content">
        {salesSummary && (
          <div className="dashboard-summary-cards">
            <div className="summary-card">
              <h3>Total Sales</h3>
              <p className="card-value">${salesSummary.totalSales.toLocaleString()}</p>
            </div>
            <div className="summary-card">
              <h3>Avg Weekly Sales</h3>
              <p className="card-value">${salesSummary.avgWeeklySales.toLocaleString()}</p>
            </div>
            <div className="summary-card">
              <h3>Holiday Sales Lift</h3>
              <p className="card-value">+{salesSummary.holidaySales.percentageIncrease.toFixed(2)}%</p>
            </div>
            <div className="summary-card">
              <h3>Top Department</h3>
              <p className="card-value">Dept {salesSummary.topDepartments[0].Dept}</p>
              <p className="card-subtitle">${salesSummary.topDepartments[0].Sales.toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="dashboard-charts">
          <div className="chart-container">
            <h2>Sales Overview</h2>
            {salesSummary && <SalesOverview salesSummary={salesSummary} />}
          </div>
          
          <div className="chart-container">
            <h2>Store Performance by Type</h2>
            {storeTypeSummary.length > 0 && <StorePerformance storeTypeSummary={storeTypeSummary} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 