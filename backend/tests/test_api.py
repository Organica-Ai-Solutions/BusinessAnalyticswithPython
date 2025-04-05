import json
from datetime import datetime, timedelta

import pytest


def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "success"
    assert data["message"] == "Service is healthy"


def test_api_docs(client):
    """Test API documentation endpoint"""
    response = client.get("/api/docs")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "success"
    assert "analytics" in data["data"]
    assert "sales" in data["data"]


def test_analytics_kpis_endpoint(client):
    """Test KPIs endpoint with various parameters"""
    # Test without parameters
    response = client.get("/api/analytics/kpis")
    assert response.status_code == 200

    # Test with valid date range
    today = datetime.now().strftime("%Y-%m-%d")
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    response = client.get(f"/api/analytics/kpis?start_date={week_ago}&end_date={today}")
    assert response.status_code == 200

    # Test with invalid date
    response = client.get("/api/analytics/kpis?start_date=invalid")
    assert response.status_code == 400

    # Test with store_id
    response = client.get("/api/analytics/kpis?store_id=1")
    assert response.status_code == 200

    # Test with invalid store_id
    response = client.get("/api/analytics/kpis?store_id=invalid")
    assert response.status_code == 400


def test_analytics_store_performance_endpoint(client):
    """Test store performance endpoint"""
    # Test without parameters
    response = client.get("/api/analytics/store-performance")
    assert response.status_code == 200

    # Test with valid year
    response = client.get("/api/analytics/store-performance?year=2024")
    assert response.status_code == 200

    # Test with invalid year
    response = client.get("/api/analytics/store-performance?year=invalid")
    assert response.status_code == 400

    # Test with store_id
    response = client.get("/api/analytics/store-performance?store_id=1")
    assert response.status_code == 200


def test_sales_endpoint(client):
    """Test sales endpoint with various parameters"""
    # Test without parameters
    response = client.get("/api/sales")
    assert response.status_code == 200

    # Test with limit
    response = client.get("/api/sales?limit=10")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data["data"]) <= 10

    # Test with invalid limit
    response = client.get("/api/sales?limit=invalid")
    assert response.status_code == 400

    # Test with date range
    today = datetime.now().strftime("%Y-%m-%d")
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    response = client.get(f"/api/sales?start_date={week_ago}&end_date={today}")
    assert response.status_code == 200


def test_sales_metrics_endpoint(client):
    """Test sales metrics endpoint"""
    response = client.get("/api/sales/metrics")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "data" in data
    assert data["status"] == "success"


def test_sales_recent_summary_endpoint(client):
    """Test recent sales summary endpoint"""
    response = client.get("/api/sales/recent-summary")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "data" in data
    assert data["status"] == "success"


def test_stores_endpoint(client):
    """Test stores endpoint"""
    response = client.get("/api/sales/stores")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "data" in data
    assert data["status"] == "success"


def test_departments_endpoint(client):
    """Test departments endpoint"""
    response = client.get("/api/sales/departments")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "data" in data
    assert data["status"] == "success"


def test_error_handling(client):
    """Test error handling for various scenarios"""
    # Test 404 error
    response = client.get("/nonexistent-endpoint")
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data["status"] == "error"
    assert "message" in data

    # Test validation error
    response = client.get("/api/analytics/kpis?year=invalid")
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data["status"] == "error"
    assert "message" in data
