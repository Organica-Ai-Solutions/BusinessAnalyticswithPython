-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS retail_analytics;

-- Connect to the database
\c retail_analytics;

-- Create the sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    sales DECIMAL(10,2) NOT NULL,
    customer_id VARCHAR(50),
    store_id VARCHAR(50) NOT NULL,
    department_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_department ON sales(department_id); 