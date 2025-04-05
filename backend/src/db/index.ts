import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../retail.db');

let db: Database | null = null;

export const initializeDb = async () => {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');

    // Create tables in order of dependencies
    await db.exec(`
      -- Create stores table first
      CREATE TABLE IF NOT EXISTS stores (
        store_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create departments table next
      CREATE TABLE IF NOT EXISTS departments (
        dept_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create sales table last with foreign key constraints
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATETIME NOT NULL,
        weekly_sales DECIMAL(10,2) NOT NULL,
        customer_id TEXT,
        store_id TEXT NOT NULL,
        dept_id INTEGER NOT NULL,
        is_holiday INTEGER DEFAULT 0,
        temperature DECIMAL(5,2),
        fuel_price DECIMAL(5,2),
        markdown DECIMAL(5,2),
        cpi DECIMAL(6,2),
        unemployment DECIMAL(4,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(store_id),
        FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
      CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
      CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
      CREATE INDEX IF NOT EXISTS idx_sales_department ON sales(dept_id);
      CREATE INDEX IF NOT EXISTS idx_sales_holiday ON sales(is_holiday);
    `);

    // Insert sample data if tables are empty
    const storeCount = await db.get('SELECT COUNT(*) as count FROM stores');
    if (storeCount.count === 0) {
      await db.exec(`
        INSERT INTO stores (store_id, name, region, type, size) VALUES 
          ('STORE001', 'Downtown Store', 'West', 'A', 151315),
          ('STORE002', 'Mall Store', 'East', 'B', 128456),
          ('STORE003', 'Suburban Store', 'South', 'C', 98765)
      `);
    }

    const deptCount = await db.get('SELECT COUNT(*) as count FROM departments');
    if (deptCount.count === 0) {
      await db.exec(`
        INSERT INTO departments (dept_id, name, category) VALUES 
          (1, 'Electronics', 'Technology'),
          (2, 'Clothing', 'Apparel'),
          (3, 'Home Goods', 'Home & Living')
      `);
    }

    const salesCount = await db.get('SELECT COUNT(*) as count FROM sales');
    if (salesCount.count === 0) {
      await db.exec(`
        INSERT INTO sales (date, weekly_sales, customer_id, store_id, dept_id, is_holiday, temperature, fuel_price, markdown, cpi, unemployment)
        VALUES 
          (datetime('now', '-1 day'), 1500.00, 'CUST001', 'STORE001', 1, 0, 72.5, 3.45, 10.0, 258.7, 5.2),
          (datetime('now', '-2 days'), 2000.00, 'CUST002', 'STORE001', 1, 0, 71.8, 3.42, 15.0, 258.7, 5.2),
          (datetime('now', '-3 days'), 1750.00, 'CUST003', 'STORE002', 2, 0, 73.2, 3.44, 5.0, 258.8, 5.1),
          (datetime('now', '-4 days'), 3000.00, 'CUST004', 'STORE002', 2, 1, 74.1, 3.41, 20.0, 258.8, 5.1),
          (datetime('now', '-5 days'), 2500.00, 'CUST005', 'STORE003', 3, 0, 72.9, 3.43, 12.5, 258.9, 5.0),
          (datetime('now', '-6 days'), 1800.00, 'CUST006', 'STORE003', 3, 0, 71.5, 3.46, 8.0, 258.9, 5.0),
          (datetime('now', '-7 days'), 2200.00, 'CUST007', 'STORE001', 1, 1, 70.8, 3.48, 25.0, 259.0, 4.9),
          (datetime('now', '-8 days'), 1900.00, 'CUST008', 'STORE002', 2, 0, 71.2, 3.47, 7.5, 259.0, 4.9),
          (datetime('now', '-9 days'), 2800.00, 'CUST009', 'STORE003', 3, 0, 72.4, 3.45, 15.0, 259.1, 4.8),
          (datetime('now', '-10 days'), 3200.00, 'CUST010', 'STORE001', 1, 1, 73.5, 3.44, 30.0, 259.1, 4.8),
          (datetime('now', '-31 days'), 1400.00, 'CUST011', 'STORE001', 1, 0, 68.5, 3.52, 5.0, 257.8, 5.4),
          (datetime('now', '-32 days'), 1900.00, 'CUST012', 'STORE001', 1, 0, 69.2, 3.51, 10.0, 257.8, 5.4),
          (datetime('now', '-33 days'), 1650.00, 'CUST013', 'STORE002', 2, 1, 70.1, 3.49, 20.0, 257.9, 5.3),
          (datetime('now', '-34 days'), 2800.00, 'CUST014', 'STORE002', 2, 0, 71.4, 3.48, 12.5, 257.9, 5.3),
          (datetime('now', '-35 days'), 2300.00, 'CUST015', 'STORE003', 3, 0, 72.0, 3.47, 8.0, 258.0, 5.2)
      `);
    }
  }
  return db;
};

export const getDb = async () => {
  if (!db) {
    await initializeDb();
  }
  return db!;
}; 