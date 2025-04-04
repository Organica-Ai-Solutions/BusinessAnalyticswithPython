import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSeasonality } from '../services/api';
import { SeasonalityByMonth, SeasonalityByWeekday, Filters } from '../types';
import FilterBar from '../components/FilterBar';
import './Seasonality.css';

const Seasonality = () => {
  const [monthlyData, setMonthlyData] = useState<SeasonalityByMonth[]>([]);
  const [weekdayData, setWeekdayData] = useState<SeasonalityByWeekday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    dimension: 'month'
  });

  useEffect(() => {
    const fetchSeasonalityData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch monthly seasonality
        const monthlyResult = await getSeasonality({ 
          ...filters, 
          dimension: 'month',
          store_id: filters.store_id,
          dept_id: filters.dept_id 
        });
        setMonthlyData(monthlyResult);

        // Fetch weekday seasonality
        const weekdayResult = await getSeasonality({ 
          ...filters, 
          dimension: 'weekday',
          store_id: filters.store_id,
          dept_id: filters.dept_id 
        });
        setWeekdayData(weekdayResult);
      } catch (err) {
        console.error('Error fetching seasonality data:', err);
        setError('Failed to load seasonality data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonalityData();
  }, [filters.store_id, filters.dept_id]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  if (loading && monthlyData.length === 0) {
    return <div className="loading">Loading seasonality data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="seasonality-page">
      <h2 className="page-title">Seasonality Analysis</h2>
      
      <FilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange}
        showDateFilters={false}
        showGroupBy={false}
        showTimePeriod={false}
      />

      <div className="grid">
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Monthly Seasonality</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_name" />
                <YAxis yAxisId="left" orientation="left" domain={[0, 'dataMax + 5000']} />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 200]} 
                  unit="%" 
                />
                <Tooltip formatter={(value, name) => {
                  if (name === 'Average Sales') return ['$' + value.toLocaleString(), name];
                  return [value + '%', name];
                }} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avg_sales" 
                  name="Average Sales" 
                  stroke="var(--primary-color)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary-color)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="seasonality_index" 
                  name="Seasonality Index" 
                  stroke="var(--success-color)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--success-color)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="explanation">
            <p>The <strong>Seasonality Index</strong> shows the relative sales performance compared to the overall average. A value of 100% means sales are at the average level, while values above 100% indicate higher than average sales.</p>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Weekly Patterns</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={weekdayData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekday_name" />
                <YAxis domain={[0, 'dataMax + 1000']} />
                <Tooltip formatter={(value) => ['$' + value.toLocaleString(), 'Avg Sales']} />
                <Bar dataKey="avg_sales" name="Average Sales" fill="var(--primary-color)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="stats-grid">
            {weekdayData.map(day => (
              <div key={day.weekday} className="day-stats">
                <h4>{day.weekday_name}</h4>
                <p className="stat-value">${day.avg_sales.toLocaleString()}</p>
                <p className="stat-index">
                  Index: <span style={{
                    color: day.seasonality_index > 100 ? 'var(--success-color)' : day.seasonality_index < 100 ? 'var(--error-color)' : 'inherit'
                  }}>
                    {day.seasonality_index.toFixed(1)}%
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Seasonality; 