import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import SalesAnalysis from './pages/SalesAnalysis'
import Seasonality from './pages/Seasonality'
import StoreComparison from './pages/StoreComparison'
import Navigation from './components/Navigation'
import Header from './components/Header'

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <div className="main-content">
          <Navigation />
          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sales" element={<SalesAnalysis />} />
              <Route path="/seasonality" element={<Seasonality />} />
              <Route path="/stores" element={<StoreComparison />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App
