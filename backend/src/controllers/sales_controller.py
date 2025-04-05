from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union

from src.database.db import get_db_connection, row_to_dict, rows_to_list
from src.utils.validation import format_response


def get_sales(
    store_id: Optional[int] = None,
    dept_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: Optional[int] = 100,
) -> Dict:
    """Get sales data with optional filters"""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT s.*, st.name as store_name, d.name as dept_name
    FROM sales s
    JOIN stores st ON s.store_id = st.store_id
    JOIN departments d ON s.dept_id = d.dept_id
    WHERE 1=1
    """
    params = []

    if store_id:
        query += " AND s.store_id = ?"
        params.append(store_id)

    if dept_id:
        query += " AND s.dept_id = ?"
        params.append(dept_id)

    if start_date:
        query += " AND s.date >= ?"
        params.append(start_date)

    if end_date:
        query += " AND s.date <= ?"
        params.append(end_date)

    query += " ORDER BY s.date DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    sales = cursor.fetchall()
    conn.close()

    return format_response(rows_to_list(sales))


def get_sales_metrics() -> Dict:
    """Get sales metrics with period comparison"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Calculate basic metrics
    cursor.execute(
        """
        SELECT 
            COUNT(*) as total_transactions,
            SUM(weekly_sales) as total_sales,
            AVG(weekly_sales) as avg_sales,
            SUM(CASE WHEN is_holiday = 1 THEN weekly_sales ELSE 0 END) as holiday_sales
        FROM sales
        """
    )
    metrics = row_to_dict(cursor.fetchone())
    conn.close()

    return format_response(metrics)


def get_recent_sales_summary() -> Dict:
    """Get recent sales summary with top performers"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get recent sales statistics
    cursor.execute(
        """
        SELECT 
            MIN(weekly_sales) as min_sales,
            MAX(weekly_sales) as max_sales,
            AVG(weekly_sales) as average_sales,
            COUNT(*) as total_transactions
        FROM sales
        WHERE date >= date('now', '-30 days')
        """
    )
    summary = row_to_dict(cursor.fetchone())
    
    if summary is None:
        summary = {
            "min_sales": 0,
            "max_sales": 0,
            "average_sales": 0,
            "total_transactions": 0
        }

    # Get holiday vs non-holiday sales comparison
    cursor.execute(
        """
        SELECT 
            AVG(CASE WHEN is_holiday = 1 THEN weekly_sales END) as holiday_avg,
            AVG(CASE WHEN is_holiday = 0 THEN weekly_sales END) as non_holiday_avg
        FROM sales
        """
    )
    holiday_comparison = row_to_dict(cursor.fetchone())
    
    # Initialize holiday sales data
    summary["holiday_sales"] = {
        "holiday_avg": 0,
        "non_holiday_avg": 0,
        "difference": 0,
        "percentage_increase": 0
    }
    
    # Calculate if we have valid data
    if (holiday_comparison and 
        holiday_comparison["holiday_avg"] is not None and 
        holiday_comparison["non_holiday_avg"] is not None and
        holiday_comparison["non_holiday_avg"] != 0):
        
        holiday_diff = holiday_comparison["holiday_avg"] - holiday_comparison["non_holiday_avg"]
        holiday_percent = (holiday_diff / holiday_comparison["non_holiday_avg"]) * 100

        summary["holiday_sales"] = {
            "holiday_avg": round(holiday_comparison["holiday_avg"], 2),
            "non_holiday_avg": round(holiday_comparison["non_holiday_avg"], 2),
            "difference": round(holiday_diff, 2),
            "percentage_increase": round(holiday_percent, 2)
        }

    conn.close()
    return format_response(summary)


def get_stores() -> Dict:
    """Get list of all stores"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM stores")
    stores = cursor.fetchall()
    conn.close()
    return format_response(rows_to_list(stores))


def get_departments() -> Dict:
    """Get list of all departments"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM departments")
    departments = cursor.fetchall()
    conn.close()
    return format_response(rows_to_list(departments))
