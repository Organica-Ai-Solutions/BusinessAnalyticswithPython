# Business Analytics - Retail Dashboard

A comprehensive retail analytics dashboard that provides insights into sales performance, store metrics, and business KPIs.

## Features

- **Sales Analytics**
  - Sales data with filtering options
  - Sales metrics and period comparison
  - Recent sales summary with top performers
  - Store and department management
  - Holiday sales comparison

- **Business Analytics**
  - Key Performance Indicators (KPIs)
  - Store performance metrics
  - Store type performance analysis
  - Time series analysis
  - Seasonality patterns

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation

### Backend
- Python with Flask
- SQLite database
- RESTful API architecture
- JSON response format

## Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── backend/
    ├── src/
    │   ├── controllers/
    │   │   ├── analytics_controller.py
    │   │   └── sales_controller.py
    │   ├── routes/
    │   │   ├── analytics.py
    │   │   └── sales.py
    │   ├── utils/
    │   │   ├── validation.py
    │   │   ├── error_handlers.py
    │   │   └── docs.py
    │   ├── database/
    │   │   └── db.py
    │   └── app.py
    └── requirements.txt
```

## API Documentation

### Analytics Endpoints

- `GET /api/analytics/kpis`
  - Get key performance indicators
  - Optional filters: start_date, end_date, store_id, dept_id

- `GET /api/analytics/store-performance`
  - Get detailed store performance metrics
  - Optional filters: year, store_id, dept_id

- `GET /api/analytics/store-type-performance`
  - Get performance metrics by store type
  - Optional filter: year

- `GET /api/analytics/time-series`
  - Get time series sales data
  - Optional filters: start_date, end_date

### Sales Endpoints

- `GET /api/sales`
  - Get sales data with filtering
  - Optional filters: store_id, dept_id, start_date, end_date, limit

- `GET /api/sales/metrics`
  - Get sales metrics with period comparison

- `GET /api/sales/recent-summary`
  - Get recent sales summary with top performers

- `GET /api/sales/stores`
  - Get list of all stores

- `GET /api/sales/departments`
  - Get list of all departments

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/business-analytics-retail.git
   cd business-analytics-retail
   ```

2. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python src/app.py
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

## Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Style
- Backend: Follow PEP 8 guidelines
- Frontend: ESLint and Prettier configuration provided

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- This project was created to demonstrate best practices in retail analytics
- Data is based on real-world retail scenarios 