from flask import Blueprint, jsonify, request
from src.database.db import get_db_connection
import pandas as pd
import numpy as np
import json
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/kpis', methods=['GET'])
def get_kpis():
    """Get key performance indicators for the business"""
    # Get query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    store_id = request.args.get('store_id', type=int)
    dept_id = request.args.get('dept_id', type=int)
    
    # Connect to the database
    conn = get_db_connection()
    
    # Base query conditions
    conditions = []
    params = []
    
    if start_date:
        conditions.append("date >= ?")
        params.append(start_date)
    
    if end_date:
        conditions.append("date <= ?")
        params.append(end_date)
    
    if store_id:
        conditions.append("store_id = ?")
        params.append(store_id)
    
    if dept_id:
        conditions.append("dept_id = ?")
        params.append(dept_id)
    
    where_clause = " AND ".join(conditions)
    if where_clause:
        where_clause = "WHERE " + where_clause
    
    # Calculate total sales
    query = f"SELECT SUM(weekly_sales) as total_sales FROM sales {where_clause}"
    total_sales = conn.execute(query, params).fetchone()['total_sales'] or 0
    
    # Calculate average weekly sales
    query = f"SELECT AVG(weekly_sales) as avg_weekly_sales FROM sales {where_clause}"
    avg_weekly_sales = conn.execute(query, params).fetchone()['avg_weekly_sales'] or 0
    
    # Calculate sales growth (compared to previous period)
    if start_date and end_date:
        # Calculate duration between dates
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        duration = (end - start).days
        
        # Get previous period
        prev_end = start
        prev_start_date = (prev_end - pd.Timedelta(days=duration)).strftime('%Y-%m-%d')
        prev_end_date = start.strftime('%Y-%m-%d')
        
        # Create new conditions for previous period
        prev_conditions = [c.replace("date >= ?", "date >= ?").replace("date <= ?", "date <= ?") 
                         for c in conditions if not (c.startswith("date >= ") or c.startswith("date <= "))]
        
        prev_params = [p for p in params if p != start_date and p != end_date]
        
        prev_where_clause = " AND ".join(prev_conditions)
        if prev_where_clause:
            if prev_conditions:
                prev_where_clause = "WHERE " + prev_where_clause + " AND date >= ? AND date <= ?"
            else:
                prev_where_clause = "WHERE date >= ? AND date <= ?"
        else:
            prev_where_clause = "WHERE date >= ? AND date <= ?"
        
        prev_params.append(prev_start_date)
        prev_params.append(prev_end_date)
        
        # Get previous period sales
        query = f"SELECT SUM(weekly_sales) as prev_sales FROM sales {prev_where_clause}"
        prev_sales = conn.execute(query, prev_params).fetchone()['prev_sales'] or 0
        
        # Calculate growth
        if prev_sales > 0:
            sales_growth = ((total_sales - prev_sales) / prev_sales) * 100
        else:
            sales_growth = 0
    else:
        sales_growth = 0
        prev_sales = 0
    
    # Count stores and departments in the dataset
    if where_clause:
        query = f"SELECT COUNT(DISTINCT store_id) as store_count FROM sales {where_clause}"
        store_count = conn.execute(query, params).fetchone()['store_count']
        
        query = f"SELECT COUNT(DISTINCT dept_id) as dept_count FROM sales {where_clause}"
        dept_count = conn.execute(query, params).fetchone()['dept_count']
    else:
        query = "SELECT COUNT(*) as store_count FROM stores"
        store_count = conn.execute(query).fetchone()['store_count']
        
        query = "SELECT COUNT(*) as dept_count FROM departments"
        dept_count = conn.execute(query).fetchone()['dept_count']
    
    # Calculate average markdown percentage
    query = f"SELECT AVG(markdown) as avg_markdown FROM sales {where_clause} AND markdown > 0"
    avg_markdown = conn.execute(query, params).fetchone()['avg_markdown'] or 0
    
    # Calculate percentage of holiday sales
    query = f"""
    SELECT 
        SUM(CASE WHEN is_holiday = 1 THEN weekly_sales ELSE 0 END) as holiday_sales,
        SUM(weekly_sales) as total_sales
    FROM sales {where_clause}
    """
    result = conn.execute(query, params).fetchone()
    holiday_sales = result['holiday_sales'] or 0
    if result['total_sales'] > 0:
        holiday_sales_pct = (holiday_sales / result['total_sales']) * 100
    else:
        holiday_sales_pct = 0
    
    conn.close()
    
    kpis = {
        "total_sales": round(total_sales, 2),
        "avg_weekly_sales": round(avg_weekly_sales, 2),
        "sales_growth": round(sales_growth, 2),
        "store_count": store_count,
        "dept_count": dept_count,
        "avg_markdown": round(avg_markdown, 2),
        "holiday_sales_percentage": round(holiday_sales_pct, 2),
        "prev_period_sales": round(prev_sales, 2)
    }
    
    return jsonify(kpis)

@analytics_bp.route('/seasonality', methods=['GET'])
def get_seasonality():
    """Get seasonality analysis by month or weekday"""
    dimension = request.args.get('dimension', 'month')  # month or weekday
    store_id = request.args.get('store_id', type=int)
    dept_id = request.args.get('dept_id', type=int)
    
    conn = get_db_connection()
    
    # Build query conditions
    conditions = []
    params = []
    
    if store_id:
        conditions.append("store_id = ?")
        params.append(store_id)
    
    if dept_id:
        conditions.append("dept_id = ?")
        params.append(dept_id)
    
    where_clause = " AND ".join(conditions)
    if where_clause:
        where_clause = "WHERE " + where_clause
    
    if dimension == 'month':
        # Get monthly sales
        query = f"""
        SELECT 
            strftime('%m', date) as month,
            AVG(weekly_sales) as avg_sales
        FROM sales
        {where_clause}
        GROUP BY month
        ORDER BY month
        """
        
        months = conn.execute(query, params).fetchall()
        
        # Calculate overall average
        query = f"SELECT AVG(weekly_sales) as overall_avg FROM sales {where_clause}"
        overall_avg = conn.execute(query, params).fetchone()['overall_avg'] or 1  # Avoid division by zero
        
        # Calculate seasonality index
        seasonality = []
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        for month in months:
            month_num = int(month['month'])
            index = (month['avg_sales'] / overall_avg) * 100
            seasonality.append({
                'month': month_num,
                'month_name': month_names[month_num - 1],
                'avg_sales': round(month['avg_sales'], 2),
                'seasonality_index': round(index, 2)
            })
        
        return jsonify(seasonality)
    
    elif dimension == 'weekday':
        # Get weekday sales
        query = f"""
        SELECT 
            strftime('%w', date) as weekday,
            AVG(weekly_sales) as avg_sales
        FROM sales
        {where_clause}
        GROUP BY weekday
        ORDER BY weekday
        """
        
        weekdays = conn.execute(query, params).fetchall()
        
        # Calculate overall average
        query = f"SELECT AVG(weekly_sales) as overall_avg FROM sales {where_clause}"
        overall_avg = conn.execute(query, params).fetchone()['overall_avg'] or 1  # Avoid division by zero
        
        # Calculate seasonality index
        seasonality = []
        weekday_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        
        for weekday in weekdays:
            weekday_num = int(weekday['weekday'])
            index = (weekday['avg_sales'] / overall_avg) * 100
            seasonality.append({
                'weekday': weekday_num,
                'weekday_name': weekday_names[weekday_num],
                'avg_sales': round(weekday['avg_sales'], 2),
                'seasonality_index': round(index, 2)
            })
        
        return jsonify(seasonality)

@analytics_bp.route('/correlation', methods=['GET'])
def get_correlation():
    """Get correlation between sales and various factors"""
    store_id = request.args.get('store_id', type=int)
    dept_id = request.args.get('dept_id', type=int)
    
    # Build query conditions
    conditions = []
    params = []
    
    if store_id:
        conditions.append("store_id = ?")
        params.append(store_id)
    
    if dept_id:
        conditions.append("dept_id = ?")
        params.append(dept_id)
    
    where_clause = " AND ".join(conditions)
    if where_clause:
        where_clause = "WHERE " + where_clause
    
    # Connect to the database and fetch the data
    conn = get_db_connection()
    query = f"""
    SELECT 
        weekly_sales, temperature, fuel_price, markdown, cpi, unemployment, is_holiday
    FROM sales
    {where_clause}
    """
    
    # Convert to pandas DataFrame for correlation analysis
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    
    # Calculate correlation
    correlation = df.corr()['weekly_sales'].drop('weekly_sales').to_dict()
    
    # Format the response
    result = [
        {'factor': 'Temperature', 'correlation': round(correlation.get('temperature', 0), 2)},
        {'factor': 'Fuel Price', 'correlation': round(correlation.get('fuel_price', 0), 2)},
        {'factor': 'Markdown', 'correlation': round(correlation.get('markdown', 0), 2)},
        {'factor': 'CPI', 'correlation': round(correlation.get('cpi', 0), 2)},
        {'factor': 'Unemployment', 'correlation': round(correlation.get('unemployment', 0), 2)},
        {'factor': 'Holiday', 'correlation': round(correlation.get('is_holiday', 0), 2)}
    ]
    
    return jsonify(result)

@analytics_bp.route('/top-performers', methods=['GET'])
def get_top_performers():
    """Get top performing stores or departments"""
    entity_type = request.args.get('type', 'store')  # store or department
    limit = request.args.get('limit', 5, type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build query conditions
    conditions = []
    params = []
    
    if start_date:
        conditions.append("s.date >= ?")
        params.append(start_date)
    
    if end_date:
        conditions.append("s.date <= ?")
        params.append(end_date)
    
    where_clause = " AND ".join(conditions)
    if where_clause:
        where_clause = "WHERE " + where_clause
    
    conn = get_db_connection()
    
    if entity_type == 'store':
        query = f"""
        SELECT 
            s.store_id, 
            st.name as store_name,
            st.region,
            st.type,
            SUM(s.weekly_sales) as total_sales,
            AVG(s.weekly_sales) as avg_sales,
            COUNT(DISTINCT s.dept_id) as dept_count
        FROM sales s
        JOIN stores st ON s.store_id = st.store_id
        {where_clause}
        GROUP BY s.store_id
        ORDER BY total_sales DESC
        LIMIT ?
        """
        params.append(limit)
        
        performers = conn.execute(query, params).fetchall()
        
        result = [{
            'store_id': p['store_id'],
            'store_name': p['store_name'],
            'region': p['region'],
            'type': p['type'],
            'total_sales': round(p['total_sales'], 2),
            'avg_sales': round(p['avg_sales'], 2),
            'dept_count': p['dept_count']
        } for p in performers]
        
    elif entity_type == 'department':
        query = f"""
        SELECT 
            s.dept_id, 
            d.name as dept_name,
            d.category,
            SUM(s.weekly_sales) as total_sales,
            AVG(s.weekly_sales) as avg_sales,
            COUNT(DISTINCT s.store_id) as store_count
        FROM sales s
        JOIN departments d ON s.dept_id = d.dept_id
        {where_clause}
        GROUP BY s.dept_id
        ORDER BY total_sales DESC
        LIMIT ?
        """
        params.append(limit)
        
        performers = conn.execute(query, params).fetchall()
        
        result = [{
            'dept_id': p['dept_id'],
            'dept_name': p['dept_name'],
            'category': p['category'],
            'total_sales': round(p['total_sales'], 2),
            'avg_sales': round(p['avg_sales'], 2),
            'store_count': p['store_count']
        } for p in performers]
    
    conn.close()
    
    return jsonify(result) 