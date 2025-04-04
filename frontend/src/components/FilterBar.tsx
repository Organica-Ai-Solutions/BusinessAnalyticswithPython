import { useState, useEffect } from 'react';
import { getStores, getDepartments } from '../services/api';
import { Store, Department, Filters } from '../types';
import './FilterBar.css';

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  showStoreFilter?: boolean;
  showDeptFilter?: boolean;
  showDateFilters?: boolean;
  showGroupBy?: boolean;
  showTimePeriod?: boolean;
}

const FilterBar = ({
  filters,
  onFilterChange,
  showStoreFilter = true,
  showDeptFilter = true,
  showDateFilters = true,
  showGroupBy = false,
  showTimePeriod = false
}: FilterBarProps) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [storesData, departmentsData] = await Promise.all([
          getStores(),
          getDepartments()
        ]);
        setStores(storesData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue: string | number | undefined = value;

    // Convert to number where appropriate
    if (['store_id', 'dept_id', 'limit'].includes(name) && value !== '') {
      newValue = parseInt(value, 10);
    }

    // Reset to undefined if empty string
    if (value === '') {
      newValue = undefined;
    }

    onFilterChange({ ...filters, [name]: newValue });
  };

  if (loading) {
    return <div className="filter-bar">Loading filters...</div>;
  }

  return (
    <div className="filter-bar">
      {showStoreFilter && (
        <div className="select-container">
          <label htmlFor="store-select">Store</label>
          <select
            id="store-select"
            name="store_id"
            value={filters.store_id || ''}
            onChange={handleChange}
          >
            <option value="">All Stores</option>
            {stores.map(store => (
              <option key={store.store_id} value={store.store_id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showDeptFilter && (
        <div className="select-container">
          <label htmlFor="dept-select">Department</label>
          <select
            id="dept-select"
            name="dept_id"
            value={filters.dept_id || ''}
            onChange={handleChange}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.dept_id} value={dept.dept_id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showDateFilters && (
        <>
          <div className="date-container">
            <label htmlFor="start-date">Start Date</label>
            <input
              type="date"
              id="start-date"
              name="start_date"
              value={filters.start_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className="date-container">
            <label htmlFor="end-date">End Date</label>
            <input
              type="date"
              id="end-date"
              name="end_date"
              value={filters.end_date || ''}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      {showGroupBy && (
        <div className="select-container">
          <label htmlFor="group-by">Group By</label>
          <select
            id="group-by"
            name="group_by"
            value={filters.group_by || 'store'}
            onChange={handleChange}
          >
            <option value="store">Store</option>
            <option value="department">Department</option>
            <option value="date">Date</option>
          </select>
        </div>
      )}

      {showTimePeriod && filters.group_by === 'date' && (
        <div className="select-container">
          <label htmlFor="time-period">Time Period</label>
          <select
            id="time-period"
            name="time_period"
            value={filters.time_period || 'month'}
            onChange={handleChange}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default FilterBar; 