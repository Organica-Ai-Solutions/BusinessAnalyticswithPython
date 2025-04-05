import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from dateutil.relativedelta import relativedelta

import pandas as pd

from src.database.db import get_db_connection, row_to_dict, rows_to_list
from src.utils.validation import format_response


def get_kpis(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    store_id: Optional[int] = None,
    dept_id: Optional[int] = None,
) -> Dict:
    """Get key performance indicators"""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        SUM(weekly_sales) as total_sales,
        AVG(weekly_sales) as avg_weekly_sales,
        COUNT(DISTINCT store_id || '-' || dept_id) as unique_combinations,
        COUNT(*) as total_transactions
    FROM sales
    WHERE 1=1
    """
    params = []

    if start_date:
        query += " AND date >= ?"
        params.append(start_date)

    if end_date:
        query += " AND date <= ?"
        params.append(end_date)

    if store_id:
        query += " AND store_id = ?"
        params.append(store_id)

    if dept_id:
        query += " AND dept_id = ?"
        params.append(dept_id)

    cursor.execute(query, params)
    kpis = row_to_dict(cursor.fetchone())

    # Calculate year-over-year growth
    if start_date and end_date:
        previous_start = (
            datetime.strptime(start_date, "%Y-%m-%d") - timedelta(days=365)
        ).strftime("%Y-%m-%d")
        previous_end = (
            datetime.strptime(end_date, "%Y-%m-%d") - timedelta(days=365)
        ).strftime("%Y-%m-%d")

        previous_query = """
        SELECT 
            SUM(weekly_sales) as total_sales
        FROM sales
        WHERE date >= ? AND date <= ?
        """
        previous_params = [previous_start, previous_end]
        
        if store_id:
            previous_query += " AND store_id = ?"
            previous_params.append(store_id)
        
        if dept_id:
            previous_query += " AND dept_id = ?"
            previous_params.append(dept_id)
            
        cursor.execute(previous_query, previous_params)
        previous_kpis = row_to_dict(cursor.fetchone())

        if previous_kpis and previous_kpis["total_sales"]:
            growth = (
                (kpis["total_sales"] - previous_kpis["total_sales"])
                / previous_kpis["total_sales"]
                * 100
            )
            kpis["sales_growth"] = round(growth, 2)
        else:
            kpis["sales_growth"] = 0

    conn.close()
    return format_response(kpis)


def get_store_performance(
    year: Optional[int] = None,
    store_id: Optional[int] = None,
    dept_id: Optional[int] = None,
) -> Dict:
    """Get store performance metrics"""
    conn = get_db_connection()
    cursor = conn.cursor()

    if not year:
        year = datetime.now().year

    query = """
    SELECT 
        s.store_id,
        st.name as store_name,
        st.type as store_type,
        COUNT(DISTINCT s.dept_id) as dept_count,
        SUM(s.weekly_sales) as total_sales,
        AVG(s.weekly_sales) as avg_sales,
        COUNT(*) as transaction_count
    FROM sales s
    JOIN stores st ON s.store_id = st.store_id
    WHERE strftime('%Y', s.date) = ?
    """
    params = [str(year)]

    if store_id:
        query += " AND s.store_id = ?"
        params.append(store_id)

    if dept_id:
        query += " AND s.dept_id = ?"
        params.append(dept_id)

    query += " GROUP BY s.store_id, st.name, st.type"

    cursor.execute(query, params)
    performance = rows_to_list(cursor.fetchall())

    # Get top departments for each store
    result = []
    for store in performance:
        dept_query = """
        SELECT 
            d.dept_id,
            d.name as dept_name,
            SUM(s.weekly_sales) as dept_sales
        FROM sales s
        JOIN departments d ON s.dept_id = d.dept_id
        WHERE s.store_id = ? AND strftime('%Y', s.date) = ?
        GROUP BY d.dept_id, d.name
        ORDER BY dept_sales DESC
        LIMIT 5
        """
        cursor.execute(dept_query, [store["store_id"], str(year)])
        store["top_departments"] = rows_to_list(cursor.fetchall())
        result.append(store)

    conn.close()
    return format_response(result)


def get_store_type_performance(year: Optional[int] = None) -> Dict:
    """Get performance metrics by store type"""
    conn = get_db_connection()
    cursor = conn.cursor()

    if not year:
        year = datetime.now().year

    query = """
    SELECT 
        st.type as store_type,
        COUNT(DISTINCT s.store_id) as store_count,
        COUNT(DISTINCT s.dept_id) as dept_count,
        SUM(s.weekly_sales) as total_sales,
        AVG(s.weekly_sales) as avg_sales,
        COUNT(*) as transaction_count
    FROM sales s
    JOIN stores st ON s.store_id = st.store_id
    WHERE strftime('%Y', s.date) = ?
    GROUP BY st.type
    """

    cursor.execute(query, [str(year)])
    performance = rows_to_list(cursor.fetchall())
    conn.close()

    return format_response(performance)


def get_time_series(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> Dict:
    """Get time series sales data"""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT 
        date,
        SUM(weekly_sales) as total_sales,
        COUNT(DISTINCT store_id) as store_count,
        COUNT(*) as transaction_count,
        AVG(weekly_sales) as avg_sale
    FROM sales
    WHERE 1=1
    """
    params = []

    if start_date:
        query += " AND date >= ?"
        params.append(start_date)

    if end_date:
        query += " AND date <= ?"
        params.append(end_date)

    query += " GROUP BY date ORDER BY date"

    cursor.execute(query, params)
    time_series = rows_to_list(cursor.fetchall())
    conn.close()

    return format_response(time_series)


def get_product_performance_with_growth(
    store_id: Optional[int] = None,
    start_date_str: Optional[str] = None,
    end_date_str: Optional[str] = None
) -> Dict:
    """Get product performance metrics including sales growth rate, with optional filters."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Define time periods based on input or defaults (re-add parsing logic)
    try:
        end_date_current = datetime.strptime(end_date_str, "%Y-%m-%d").date() if end_date_str else datetime.now().date()
        start_date_current = datetime.strptime(start_date_str, "%Y-%m-%d").date() if start_date_str else end_date_current - timedelta(days=30)
        
        period_duration = (end_date_current - start_date_current).days
        end_date_previous = start_date_current - timedelta(days=1)
        start_date_previous = end_date_previous - timedelta(days=period_duration)
    except (ValueError, TypeError): # Catch TypeError if date strings are None
        print("Invalid or missing date format received, defaulting to last 30/60 days.")
        end_date_current = datetime.now().date()
        start_date_current = end_date_current - timedelta(days=30)
        end_date_previous = start_date_current - timedelta(days=1)
        start_date_previous = end_date_previous - timedelta(days=30)
        
    start_date_current_sql = start_date_current.strftime("%Y-%m-%d")
    end_date_current_sql = end_date_current.strftime("%Y-%m-%d")
    start_date_previous_sql = start_date_previous.strftime("%Y-%m-%d")
    end_date_previous_sql = end_date_previous.strftime("%Y-%m-%d")

    # Build base query and params (re-add filtering logic)
    query = """
        SELECT 
            d.dept_id,
            d.name,
            d.category,
            COUNT(DISTINCT s.store_id) as store_presence,
            SUM(CASE WHEN s.date BETWEEN ? AND ? THEN s.weekly_sales ELSE 0 END) as total_sales_current,
            SUM(CASE WHEN s.date BETWEEN ? AND ? THEN s.weekly_sales ELSE 0 END) as total_sales_previous,
            AVG(s.weekly_sales) as avg_sales_overall,
            COUNT(DISTINCT strftime('%Y-%m', s.date)) as months_active
        FROM departments d
        LEFT JOIN sales s ON s.dept_id = d.dept_id
        WHERE 1=1 
    """
    params = [start_date_current_sql, end_date_current_sql, start_date_previous_sql, end_date_previous_sql]

    if store_id:
        query += " AND s.store_id = ? "
        params.append(store_id)
        
    query += " AND s.date BETWEEN ? AND ? " # Filter overall metrics by the wider date range used for comparison
    params.extend([start_date_previous_sql, end_date_current_sql])

    query += " GROUP BY d.dept_id, d.name, d.category ORDER BY total_sales_current DESC "

    cursor.execute(query, params)
    
    products_raw = cursor.fetchall()
    products = rows_to_list(products_raw)

    # Calculate growth rate (same logic as before)
    for product in products:
        current_sales = product.get('total_sales_current', 0)
        previous_sales = product.get('total_sales_previous', 0)
        
        if previous_sales and previous_sales != 0:
            growth = ((current_sales - previous_sales) / previous_sales) * 100
            product['sales_growth_rate'] = round(growth, 2)
        elif current_sales > 0 and previous_sales == 0:
             product['sales_growth_rate'] = 100.0
        else:
            product['sales_growth_rate'] = 0.0
            
        product['total_sales'] = current_sales
        product['avg_sales'] = product.get('avg_sales_overall', 0)
        # Optionally remove intermediate fields
        # del product['total_sales_current'] 
        # del product['total_sales_previous']
        del product['avg_sales_overall']
        
    conn.close()
    return format_response(products)
