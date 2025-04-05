"""API Documentation Module

This module contains documentation for all API endpoints, including descriptions,
parameters, response formats, and example usage.
"""

ANALYTICS_DOCS = {
    "kpis": {
        "description": "Get key performance indicators for the business",
        "parameters": {
            "start_date": "Start date in YYYY-MM-DD format",
            "end_date": "End date in YYYY-MM-DD format",
            "store_id": "Filter by store ID (integer)",
            "dept_id": "Filter by department ID (integer)",
        },
        "response": {
            "total_sales": "Total sales for the period",
            "avg_weekly_sales": "Average weekly sales",
            "sales_growth": "Sales growth percentage compared to previous period",
            "store_count": "Number of active stores",
            "dept_count": "Number of active departments",
            "avg_markdown": "Average markdown percentage",
            "holiday_sales_percentage": "Percentage of sales during holidays",
            "prev_period_sales": "Total sales from previous period",
        },
        "example": {
            "request": "/api/analytics/kpis?start_date=2023-01-01&end_date=2023-12-31",
            "response": {
                "status": "success",
                "data": {
                    "total_sales": 1000000.00,
                    "avg_weekly_sales": 20000.00,
                    "sales_growth": 5.2,
                    "store_count": 45,
                    "dept_count": 20,
                    "avg_markdown": 15.5,
                    "holiday_sales_percentage": 25.8,
                    "prev_period_sales": 950000.00,
                },
            },
        },
    },
    "store_performance": {
        "description": "Get detailed store performance metrics and top departments",
        "parameters": {
            "year": "Filter by year (integer)",
            "store_id": "Filter by store ID (integer)",
            "dept_id": "Filter by department ID (integer)",
        },
        "response": {
            "store_id": "Store identifier",
            "name": "Store name",
            "type": "Store type",
            "region": "Store region",
            "metrics": {
                "total_sales": "Total sales",
                "avg_weekly_sales": "Average weekly sales",
                "weeks": "Number of weeks with sales",
                "department_count": "Number of departments",
            },
            "top_departments": "List of top performing departments",
        },
    },
    "store_type_performance": {
        "description": "Get performance metrics grouped by store type",
        "parameters": {"year": "Filter by year (integer)"},
        "response": {
            "type": "Store type",
            "count": "Number of stores",
            "total_sales": "Total sales",
            "avg_weekly_sales": "Average weekly sales",
            "avg_size": "Average store size",
            "sales_per_sqft": "Sales per square foot",
        },
    },
    "time_series": {
        "description": "Get time series sales data with optional date filtering",
        "parameters": {
            "start_date": "Start date in YYYY-MM-DD format",
            "end_date": "End date in YYYY-MM-DD format",
        },
        "response": {
            "date": "Date of sales",
            "sales": "Total sales for the date",
            "holiday": "Whether the date was a holiday",
        },
    },
}

SALES_DOCS = {
    "sales": {
        "description": "Get sales data with optional filtering",
        "parameters": {
            "store_id": "Filter by store ID (integer)",
            "dept_id": "Filter by department ID (integer)",
            "start_date": "Start date in YYYY-MM-DD format",
            "end_date": "End date in YYYY-MM-DD format",
            "limit": "Maximum number of records to return (default: 100)",
        },
        "response": {
            "sale_id": "Sale identifier",
            "store_id": "Store identifier",
            "store_name": "Store name",
            "dept_id": "Department identifier",
            "dept_name": "Department name",
            "date": "Sale date",
            "weekly_sales": "Weekly sales amount",
            "is_holiday": "Holiday flag",
            "temperature": "Temperature",
            "fuel_price": "Fuel price",
            "markdown": "Markdown percentage",
            "cpi": "Consumer Price Index",
            "unemployment": "Unemployment rate",
        },
    },
    "metrics": {
        "description": "Get sales metrics with period comparison",
        "response": {
            "sales_growth": "Sales growth percentage",
            "avg_ticket_size": "Average ticket size",
            "customer_count": "Number of customers",
            "conversion_rate": "Conversion rate percentage",
        },
    },
    "recent_summary": {
        "description": "Get recent sales summary with top performers",
        "response": {
            "total_sales": "Total sales",
            "average_sales": "Average sales",
            "max_sales": "Maximum sales",
            "min_sales": "Minimum sales",
            "top_stores": "List of top performing stores",
            "top_departments": "List of top performing departments",
            "holiday_sales": "Holiday vs non-holiday sales comparison",
        },
    },
    "stores": {
        "description": "Get list of all stores",
        "response": {
            "store_id": "Store identifier",
            "name": "Store name",
            "type": "Store type",
            "region": "Store region",
            "size": "Store size",
        },
    },
    "departments": {
        "description": "Get list of all departments",
        "response": {
            "dept_id": "Department identifier",
            "name": "Department name",
            "category": "Department category",
        },
    },
}
