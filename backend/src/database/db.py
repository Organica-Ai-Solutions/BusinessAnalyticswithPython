import os
import random
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Any, Union

import pandas as pd

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "retail.db"
)


def get_db_connection():
    """Create a connection to the SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_dict(row):
    """Convert a sqlite3.Row to a dictionary"""
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}


def rows_to_list(rows):
    """Convert a list of sqlite3.Row objects to a list of dictionaries"""
    if rows is None:
        return []
    return [row_to_dict(row) for row in rows]


def initialize_db():
    """Initialize the database with tables and sample data if it doesn't exist"""
    if not os.path.exists(DB_PATH):
        print("Creating new database and loading sample data...")
        conn = get_db_connection()
        create_tables(conn)
        load_sample_data(conn)
        conn.close()
        print("Database initialized successfully!")
    else:
        print("Database already exists.")


def create_tables(conn):
    """Create the necessary tables for the retail database"""
    cursor = conn.cursor()

    # Create stores table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS stores (
        store_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        size_sqft INTEGER,
        type TEXT
    )
    """
    )

    # Create departments table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS departments (
        dept_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT
    )
    """
    )

    # Create sales table
    cursor.execute(
        """
    CREATE TABLE IF NOT EXISTS sales (
        sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER,
        dept_id INTEGER,
        date TEXT,
        weekly_sales REAL,
        is_holiday INTEGER,
        temperature REAL,
        fuel_price REAL,
        markdown REAL,
        cpi REAL,
        unemployment REAL,
        FOREIGN KEY (store_id) REFERENCES stores (store_id),
        FOREIGN KEY (dept_id) REFERENCES departments (dept_id)
    )
    """
    )

    conn.commit()


def load_sample_data(conn):
    """Load sample data into the database"""
    cursor = conn.cursor()

    # Sample store data
    stores = [
        (1, "Store A", "North", 150000, "Supercenter"),
        (2, "Store B", "South", 120000, "Discount"),
        (3, "Store C", "East", 100000, "Neighborhood"),
        (4, "Store D", "West", 160000, "Supercenter"),
        (5, "Store E", "North", 140000, "Discount"),
        (6, "Store F", "South", 90000, "Neighborhood"),
        (7, "Store G", "East", 180000, "Supercenter"),
        (8, "Store H", "West", 110000, "Discount"),
        (9, "Store I", "North", 95000, "Neighborhood"),
        (10, "Store J", "South", 170000, "Supercenter"),
    ]

    cursor.executemany("INSERT INTO stores VALUES (?, ?, ?, ?, ?)", stores)

    # Sample department data
    departments = [
        (1, "Grocery", "Food"),
        (2, "Dairy", "Food"),
        (3, "Bakery", "Food"),
        (4, "Meat", "Food"),
        (5, "Produce", "Food"),
        (6, "Electronics", "Technology"),
        (7, "Clothing", "Apparel"),
        (8, "Home Goods", "Home"),
        (9, "Health & Beauty", "Personal Care"),
        (10, "Toys", "Entertainment"),
    ]

    cursor.executemany("INSERT INTO departments VALUES (?, ?, ?)", departments)

    # Generate sample sales data over the past 2 years
    sales_data = []
    start_date = datetime.now() - timedelta(days=730)  # 2 years ago

    # Seasonal factors by month (1 = average, >1 = higher, <1 = lower)
    seasonal_factors = {
        1: 0.8,  # January (post-holiday drop)
        2: 0.7,  # February
        3: 0.9,  # March
        4: 1.0,  # April
        5: 1.1,  # May
        6: 1.2,  # June (summer uptick)
        7: 1.3,  # July
        8: 1.25,  # August (back to school)
        9: 1.1,  # September
        10: 1.0,  # October
        11: 1.2,  # November (pre-holiday)
        12: 1.8,  # December (holiday peak)
    }

    # Department baseline sales (average weekly sales)
    dept_baselines = {
        1: 20000,  # Grocery (high volume)
        2: 12000,  # Dairy
        3: 9000,  # Bakery
        4: 14000,  # Meat
        5: 16000,  # Produce
        6: 18000,  # Electronics (high value)
        7: 15000,  # Clothing
        8: 13000,  # Home Goods
        9: 11000,  # Health & Beauty
        10: 8000,  # Toys (except during holidays)
    }

    # Store performance factors
    store_factors = {
        1: 1.2,  # Store A (high performer)
        2: 0.9,  # Store B
        3: 0.8,  # Store C
        4: 1.3,  # Store D (highest performer)
        5: 1.1,  # Store E
        6: 0.7,  # Store F (low performer)
        7: 1.25,  # Store G
        8: 0.85,  # Store H
        9: 0.75,  # Store I
        10: 1.15,  # Store J
    }

    current_date = start_date
    sale_id = 1

    # Holidays (MM-DD format)
    holidays = ["01-01", "07-04", "11-25", "12-25"]

    while current_date < datetime.now():
        is_holiday = 1 if current_date.strftime("%m-%d") in holidays else 0

        # Environmental factors
        temperature = 70 + random.uniform(-20, 20)  # Average around 70F
        fuel_price = 3.0 + random.uniform(-0.5, 1.0)  # Average around $3/gallon
        cpi = 260 + random.uniform(-5, 10)  # Consumer Price Index
        unemployment = 5.0 + random.uniform(-1.5, 2.0)  # Unemployment rate

        # Apply seasonal adjustments
        month_factor = seasonal_factors[current_date.month]

        # Holiday boost
        holiday_boost = 1.5 if is_holiday else 1.0

        for store_id in range(1, 11):
            store_factor = store_factors[store_id]

            for dept_id in range(1, 11):
                baseline = dept_baselines[dept_id]

                # Special case for toys during December
                dec_toy_boost = (
                    2.0 if (dept_id == 10 and current_date.month == 12) else 1.0
                )

                # Weekly sales calculation with some randomness
                weekly_sales = (
                    baseline
                    * store_factor
                    * month_factor
                    * holiday_boost
                    * dec_toy_boost
                )
                weekly_sales *= random.uniform(0.9, 1.1)  # Add some randomness

                # Apply markdowns randomly (between 0 and 30%)
                markdown = 0
                if random.random() < 0.3:  # 30% chance of markdown
                    markdown = random.uniform(5, 30)
                    weekly_sales *= 1 + (markdown / 100) * 0.8  # Markdown boosts sales

                sales_data.append(
                    (
                        sale_id,
                        store_id,
                        dept_id,
                        current_date.strftime("%Y-%m-%d"),
                        round(weekly_sales, 2),
                        is_holiday,
                        round(temperature, 2),
                        round(fuel_price, 2),
                        round(markdown, 2),
                        round(cpi, 2),
                        round(unemployment, 2),
                    )
                )

                sale_id += 1

        # Move to next week
        current_date += timedelta(days=7)

    cursor.executemany(
        "INSERT INTO sales (sale_id, store_id, dept_id, date, weekly_sales, is_holiday, temperature, fuel_price, markdown, cpi, unemployment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        sales_data,
    )

    conn.commit()
