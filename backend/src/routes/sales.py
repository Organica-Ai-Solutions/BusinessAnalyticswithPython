from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import random

from src.controllers.sales_controller import (
    get_departments,
    get_sales,
    get_sales_metrics,
    get_recent_sales_summary,
    get_stores,
)
from src.database.db import get_db_connection, rows_to_list
from src.utils.validation import (
    validate_date,
    validate_group_by,
    validate_id,
    validate_limit,
    validate_time_period,
    validate_year,
)

sales_bp = Blueprint("sales", __name__, url_prefix="/api/sales")


@sales_bp.route("", methods=["GET"])
@sales_bp.route("/", methods=["GET"])
def get_sales_data():
    """Get sales data with optional filters"""
    store_id = validate_id(request.args.get("store_id"), "store_id")
    dept_id = validate_id(request.args.get("dept_id"), "dept_id")
    start_date = validate_date(request.args.get("start_date"), "start_date")
    end_date = validate_date(request.args.get("end_date"), "end_date")
    limit = validate_limit(request.args.get("limit"))

    return get_sales(store_id, dept_id, start_date, end_date, limit)


@sales_bp.route("/metrics", methods=["GET"])
def sales_metrics():
    """Get sales metrics with period comparison"""
    return get_sales_metrics()


@sales_bp.route("/recent-summary", methods=["GET"])
def recent_summary():
    """Get recent sales summary with top performers"""
    return get_recent_sales_summary()


@sales_bp.route("/stores", methods=["GET"])
def stores():
    """Get list of all stores"""
    return get_stores()


@sales_bp.route("/departments", methods=["GET"])
def departments():
    """Get list of all departments"""
    return get_departments()


@sales_bp.route("/summary", methods=["GET"])
def get_sales_summary():
    """Get sales summary by store, department, or time period"""
    # Get query parameters
    allowed_group_by = ["store", "department", "date"]
    allowed_time_periods = ["day", "week", "month", "year"]
    
    group_by = validate_group_by(request.args.get("group_by", "store"), allowed_group_by)
    time_period = validate_time_period(request.args.get("time_period", "month"), allowed_time_periods)
    start_date = validate_date(request.args.get("start_date"), "start_date")
    end_date = validate_date(request.args.get("end_date"), "end_date")

    # Connect to the database
    conn = get_db_connection()
    cursor = conn.cursor()

    # Build the query based on grouping
    if group_by == "store":
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

    elif group_by == "department":
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

    elif group_by == "date":
        # Format the date based on time period
        if time_period == "day":
            date_format = "%Y-%m-%d"
        elif time_period == "week":
            date_format = "%Y-%W"
        elif time_period == "year":
            date_format = "%Y"
        else:  # Default to month
            date_format = "%Y-%m"

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
    summary = rows_to_list(cursor.fetchall())

    conn.close()

    return jsonify({"status": "success", "data": summary})


@sales_bp.route("/holiday-comparison", methods=["GET"])
def get_holiday_comparison():
    """Get comparison of holiday vs. non-holiday sales"""
    year = validate_year(request.args.get("year"))
    store_id = validate_id(request.args.get("store_id"), "store_id")
    dept_id = validate_id(request.args.get("dept_id"), "dept_id")

    conn = get_db_connection()

    # Build query conditions
    conditions = ["1=1"]
    params = []

    if year:
        conditions.append("strftime('%Y', date) = ?")
        params.append(str(year))

    if store_id:
        conditions.append("store_id = ?")
        params.append(store_id)

    if dept_id:
        conditions.append("dept_id = ?")
        params.append(dept_id)

    where_clause = " AND ".join(conditions)

    # Get holiday vs non-holiday sales
    query = f"""
    SELECT 
        is_holiday,
        COUNT(*) as count,
        SUM(weekly_sales) as total,
        AVG(weekly_sales) as avg
    FROM sales
    WHERE {where_clause}
    GROUP BY is_holiday
    """

    cursor = conn.cursor()
    cursor.execute(query, params)
    results = rows_to_list(cursor.fetchall())

    # Format response
    holiday_data = next(
        (r for r in results if r["is_holiday"] == 1), {"count": 0, "total": 0, "avg": 0}
    )
    non_holiday_data = next(
        (r for r in results if r["is_holiday"] == 0), {"count": 0, "total": 0, "avg": 0}
    )

    # Calculate difference and percentage increase
    difference = holiday_data["avg"] - non_holiday_data["avg"]
    percentage_increase = (
        (difference / non_holiday_data["avg"] * 100)
        if non_holiday_data["avg"] > 0
        else 0
    )

    response = {
        "holiday_sales": {
            "avg": round(holiday_data["avg"], 2),
            "total": round(holiday_data["total"], 2),
            "count": holiday_data["count"],
        },
        "non_holiday_sales": {
            "avg": round(non_holiday_data["avg"], 2),
            "total": round(non_holiday_data["total"], 2),
            "count": non_holiday_data["count"],
        },
        "comparison": {
            "difference": round(difference, 2),
            "percentage_increase": round(percentage_increase, 2),
        },
    }

    conn.close()
    return jsonify({"status": "success", "data": response})


@sales_bp.route("/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """Get dashboard statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get store count
    cursor.execute("SELECT COUNT(DISTINCT store_id) as count FROM stores")
    store_count = cursor.fetchone()[0]

    # Get total sales and record count
    cursor.execute("""
        SELECT 
            SUM(weekly_sales) as total_sales,
            COUNT(*) as count
        FROM sales
    """)
    sales_data = cursor.fetchone()
    total_sales = sales_data[0]
    record_count = sales_data[1]

    conn.close()

    return jsonify({
        "stores": {"count": store_count},
        "sales": {
            "total_sales": total_sales,
            "count": record_count
        }
    })


@sales_bp.route("/dashboard/sales", methods=["GET"])
def get_dashboard_sales():
    """Get sales data for dashboard charts"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get sales data for the last 12 months
    cursor.execute("""
        SELECT 
            strftime('%Y-%m', date) as month,
            SUM(weekly_sales) as total_sales
        FROM sales
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month DESC
        LIMIT 12
    """)
    sales_data = rows_to_list(cursor.fetchall())
    
    # Format data for the chart
    dates = [row["month"] for row in sales_data][::-1]
    values = [row["total_sales"] for row in sales_data][::-1]

    conn.close()

    return jsonify({
        "dates": dates,
        "values": values
    })


@sales_bp.route("/dashboard/categories", methods=["GET"])
def get_dashboard_categories():
    """Get category distribution data"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            d.category,
            SUM(s.weekly_sales) as total_sales
        FROM sales s
        JOIN departments d ON s.dept_id = d.dept_id
        GROUP BY d.category
        ORDER BY total_sales DESC
    """)
    categories = rows_to_list(cursor.fetchall())

    conn.close()

    return jsonify([
        {"name": cat["category"], "value": cat["total_sales"]}
        for cat in categories
    ])


@sales_bp.route("/dashboard/regions", methods=["GET"])
def get_dashboard_regions():
    """Get regional sales data"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            st.region,
            SUM(s.weekly_sales) as total_sales
        FROM sales s
        JOIN stores st ON s.store_id = st.store_id
        GROUP BY st.region
        ORDER BY total_sales DESC
    """)
    regions = rows_to_list(cursor.fetchall())

    conn.close()

    return jsonify([
        {"region": reg["region"], "sales": reg["total_sales"]}
        for reg in regions
    ])


@sales_bp.route("/dashboard/top-products", methods=["GET"])
def get_dashboard_top_products():
    """Get top performing products"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            d.name,
            SUM(s.weekly_sales) as total_sales
        FROM sales s
        JOIN departments d ON s.dept_id = d.dept_id
        GROUP BY d.dept_id
        ORDER BY total_sales DESC
        LIMIT 10
    """)
    products = rows_to_list(cursor.fetchall())

    # Calculate growth (simulated for now)
    result = []
    for product in products:
        growth = random.uniform(-15, 25)  # Simulated growth rate
        result.append({
            "name": product["name"],
            "sales": product["total_sales"],
            "growth": growth
        })

    conn.close()

    return jsonify(result)


@sales_bp.route("/dashboard/activity", methods=["GET"])
def get_dashboard_activity():
    """Get recent activity"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            s.date,
            st.name as store_name,
            d.name as dept_name,
            s.weekly_sales
        FROM sales s
        JOIN stores st ON s.store_id = st.store_id
        JOIN departments d ON s.dept_id = d.dept_id
        ORDER BY s.date DESC
        LIMIT 10
    """)
    activities = rows_to_list(cursor.fetchall())

    conn.close()

    return jsonify(activities)
