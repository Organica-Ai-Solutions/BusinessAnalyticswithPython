from flask import Blueprint, jsonify, request
from src.database.db import get_db_connection

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('/', methods=['GET'])
def get_sales():
    """Get sales data with optional filtering"""
    # Get query parameters
    store_id = request.args.get('store_id', type=int)
    dept_id = request.args.get('dept_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = request.args.get('limit', 100, type=int)
    
    # Connect to the database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build the query
    query = """
    SELECT s.sale_id, s.store_id, st.name as store_name, s.dept_id, 
           d.name as dept_name, s.date, s.weekly_sales, s.is_holiday, 
           s.temperature, s.fuel_price, s.markdown, s.cpi, s.unemployment
    FROM sales s
    JOIN stores st ON s.store_id = st.store_id
    JOIN departments d ON s.dept_id = d.dept_id
    WHERE 1=1
    """
    params = []
    
    # Add filters
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
    
    # Add ordering and limit
    query += " ORDER BY s.date DESC LIMIT ?"
    params.append(limit)
    
    # Execute the query
    cursor.execute(query, params)
    sales = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify(sales)

@sales_bp.route('/summary', methods=['GET'])
def get_sales_summary():
    """Get sales summary by store, department, or time period"""
    # Get query parameters
    group_by = request.args.get('group_by', 'store')  # store, department, or date
    time_period = request.args.get('time_period', 'month')  # day, week, month, year
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Connect to the database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build the query based on grouping
    if group_by == 'store':
        query = """
        SELECT s.store_id, st.name as store_name, st.region, st.type,
               SUM(s.weekly_sales) as total_sales,
               AVG(s.weekly_sales) as avg_weekly_sales,
               COUNT(DISTINCT strftime('%Y-%W', s.date)) as weeks_count
        FROM sales s
        JOIN stores st ON s.store_id = st.store_id
        """
        group_clause = " GROUP BY s.store_id"
        order_clause = " ORDER BY total_sales DESC"
    
    elif group_by == 'department':
        query = """
        SELECT s.dept_id, d.name as dept_name, d.category,
               SUM(s.weekly_sales) as total_sales,
               AVG(s.weekly_sales) as avg_weekly_sales,
               COUNT(DISTINCT strftime('%Y-%W', s.date)) as weeks_count
        FROM sales s
        JOIN departments d ON s.dept_id = d.dept_id
        """
        group_clause = " GROUP BY s.dept_id"
        order_clause = " ORDER BY total_sales DESC"
    
    elif group_by == 'date':
        # Format the date based on time period
        if time_period == 'day':
            date_format = '%Y-%m-%d'
        elif time_period == 'week':
            date_format = '%Y-%W'
        elif time_period == 'year':
            date_format = '%Y'
        else:  # Default to month
            date_format = '%Y-%m'
        
        query = f"""
        SELECT strftime('{date_format}', s.date) as time_period,
               SUM(s.weekly_sales) as total_sales,
               AVG(s.weekly_sales) as avg_weekly_sales,
               COUNT(*) as record_count
        FROM sales s
        """
        group_clause = f" GROUP BY strftime('{date_format}', s.date)"
        order_clause = " ORDER BY time_period"
    
    # Add where clause for date filtering
    where_clause = " WHERE 1=1"
    params = []
    
    if start_date:
        where_clause += " AND s.date >= ?"
        params.append(start_date)
    
    if end_date:
        where_clause += " AND s.date <= ?"
        params.append(end_date)
    
    # Combine all parts of the query
    full_query = query + where_clause + group_clause + order_clause
    
    # Execute the query
    cursor.execute(full_query, params)
    summary = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify(summary)

@sales_bp.route('/stores', methods=['GET'])
def get_stores():
    """Get list of all stores"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM stores ORDER BY store_id")
    stores = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify(stores)

@sales_bp.route('/departments', methods=['GET'])
def get_departments():
    """Get list of all departments"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM departments ORDER BY dept_id")
    departments = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify(departments) 