import { NavLink } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  return (
    <nav className="navigation">
      <ul className="nav-list">
        <li className="nav-item">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <i className="nav-icon">📊</i>
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/sales" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <i className="nav-icon">💰</i>
            <span>Sales Analysis</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/seasonality" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <i className="nav-icon">📅</i>
            <span>Seasonality</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/stores" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <i className="nav-icon">🏪</i>
            <span>Store Comparison</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation; 