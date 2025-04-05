from flask import Blueprint, jsonify, request, Response
from datetime import datetime, timedelta
import pandas as pd
import io
from src.database.db import get_db_connection, rows_to_list, row_to_dict

dashboard_bp = Blueprint('dashboard', __name__, url_prefix="/api/dashboard")

@dashboard_bp.route('/stats')
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Calculate stats over the entire dataset timeframe
    # Correct Average Order Value calculation
    # Remove Conversion Rate calculation
    cursor.execute("""
        SELECT 
            SUM(weekly_sales) as total_sales,
            COUNT(DISTINCT sale_id) as total_orders,
            CASE 
                WHEN COUNT(DISTINCT sale_id) > 0 THEN SUM(weekly_sales) / COUNT(DISTINCT sale_id)
                ELSE 0 
            END as average_order_value
        FROM sales 
        -- REMOVED: WHERE strftime('%Y', date) = ?
    """)
    
    stats = row_to_dict(cursor.fetchone())
    
    # REMOVED Conversion Rate Calculation
    # cursor.execute("SELECT COUNT(*) as total_visits ...")
    # total_visits = cursor.fetchone()[0]
    # stats['conversion_rate'] = ...
    
    conn.close()
    
    return jsonify(stats)

@dashboard_bp.route('/sales')
def get_sales():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get daily sales for the last 30 days
    cursor.execute("""
        SELECT 
            date,
            SUM(weekly_sales) as daily_sales,
            COUNT(DISTINCT sale_id) as daily_orders
        FROM sales 
        WHERE date >= date('now', '-30 days')
        GROUP BY date
        ORDER BY date
    """)
    
    results = rows_to_list(cursor.fetchall())
    conn.close()
    
    return jsonify({
        'dates': [r['date'] for r in results],
        'sales': [r['daily_sales'] for r in results],
        'orders': [r['daily_orders'] for r in results]
    })

@dashboard_bp.route('/categories')
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get sales by department category
    cursor.execute("""
        SELECT 
            d.category,
            SUM(s.weekly_sales) as total_sales
        FROM sales s
        JOIN departments d ON s.dept_id = d.dept_id
        GROUP BY d.category
        ORDER BY total_sales DESC
    """)
    
    results = rows_to_list(cursor.fetchall())
    conn.close()
    
    return jsonify({
        'categories': [r['category'] for r in results],
        'sales': [r['total_sales'] for r in results]
    })

@dashboard_bp.route('/regions')
def get_regions():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get sales by store region
    cursor.execute("""
        SELECT 
            st.region,
            SUM(s.weekly_sales) as total_sales
        FROM sales s
        JOIN stores st ON s.store_id = st.store_id
        GROUP BY st.region
        ORDER BY total_sales DESC
    """)
    
    results = rows_to_list(cursor.fetchall())
    conn.close()
    
    return jsonify({
        'regions': [r['region'] for r in results],
        'sales': [r['total_sales'] for r in results]
    })

@dashboard_bp.route('/top-products')
def get_top_products():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get top 10 departments by sales
    cursor.execute("""
        SELECT 
            d.name,
            SUM(s.weekly_sales) as total_sales,
            COUNT(DISTINCT s.sale_id) as total_orders
        FROM sales s
        JOIN departments d ON s.dept_id = d.dept_id
        GROUP BY d.dept_id
        ORDER BY total_sales DESC
        LIMIT 10
    """)
    
    results = rows_to_list(cursor.fetchall())
    conn.close()
    
    return jsonify([{
        'name': r['name'],
        'sales': r['total_sales'],
        'total_orders': r['total_orders']
    } for r in results])

# New route to get a list of all stores
@dashboard_bp.route("/stores", methods=["GET"])
def get_stores():
    """Fetches a list of all stores from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT store_id, name FROM stores ORDER BY store_id")
        stores = rows_to_list(cursor.fetchall())
        return jsonify(stores)
    except Exception as e:
        print(f"Error fetching stores: {e}") # Log the error
        return jsonify({"error": "Failed to fetch stores"}), 500
    finally:
        conn.close()

# New route to export dashboard data
@dashboard_bp.route("/export", methods=["POST"])
def export_dashboard_data():
    """Exports current dashboard data as CSV."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # --- Fetch data similar to dashboard routes --- 
        # Fetch Stats (simplified for example)
        cursor.execute("SELECT SUM(weekly_sales) as total_sales FROM sales")
        stats = row_to_dict(cursor.fetchone())
        stats_df = pd.DataFrame([stats]) # Put into DataFrame

        # Fetch Top Products
        cursor.execute("""
            SELECT d.name, SUM(s.weekly_sales) as total_sales, COUNT(DISTINCT s.sale_id) as total_orders
            FROM sales s JOIN departments d ON s.dept_id = d.dept_id
            GROUP BY d.dept_id ORDER BY total_sales DESC LIMIT 10
        """)
        top_products = rows_to_list(cursor.fetchall())
        top_products_df = pd.DataFrame(top_products)
        
        # Fetch Category Sales
        cursor.execute("""
            SELECT d.category, SUM(s.weekly_sales) as total_sales
            FROM sales s JOIN departments d ON s.dept_id = d.dept_id
            GROUP BY d.category ORDER BY total_sales DESC
        """)
        categories = rows_to_list(cursor.fetchall())
        categories_df = pd.DataFrame(categories)

        # --- Create CSV Output --- 
        output = io.StringIO()
        
        # Write dataframes to the buffer, adding section headers
        output.write("Dashboard Stats\n")
        stats_df.to_csv(output, index=False)
        output.write("\nTop Products\n")
        top_products_df.to_csv(output, index=False)
        output.write("\nSales by Category\n")
        categories_df.to_csv(output, index=False)
        
        output.seek(0) # Rewind buffer
        
        # Create Flask response
        return Response(
            output,
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=dashboard_export.csv"}
        )

    except Exception as e:
        print(f"Error exporting dashboard data: {e}") # Log error
        return jsonify({"error": "Failed to export dashboard data"}), 500
    finally:
        conn.close()

# ... (Potential future routes) 