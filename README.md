# Business Analytics with Python

A comprehensive retail analytics dashboard project that demonstrates business analytics techniques using Python and a React frontend.

## Project Structure

```
business-analytics-retail/
│
├── data/                 # Data storage for retail datasets
│
├── src/                  # Backend Python code
│   ├── data/             # Data processing and handling scripts
│   └── analysis/         # Analysis modules
│
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
│   └── public/           # Static assets
│
└── book/                 # Book chapters and materials
```

## Features

- Interactive retail analytics dashboard
- Sales and store performance visualizations
- Data-driven insights from retail datasets
- Modern React frontend with Chart.js
- Responsive design for desktop and mobile

## Backend Technologies

- Python
- Pandas
- NumPy
- Matplotlib
- Seaborn

## Frontend Technologies

- React
- TypeScript
- Chart.js
- CSS3

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/Organica-Ai-Solutions/BusinessAnalyticswithPython.git
   cd BusinessAnalyticswithPython
   ```

2. Install backend dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd src
   python app.py
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Data Sources

The retail dataset used in this project contains:
- Sales data across multiple stores and departments
- Store features and attributes
- External factors like temperature, fuel prices, and economic indicators

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Walmart Retail Dataset from Kaggle
- Business Analytics textbook and materials 