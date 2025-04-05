from datetime import datetime

import pytest
from werkzeug.exceptions import BadRequest

from src.utils.error_handlers import (APIError, DatabaseError, NotFoundError,
                                      ValidationError)
from src.utils.validation import (format_response, validate_date,
                                  validate_group_by, validate_id,
                                  validate_limit, validate_time_period,
                                  validate_year)


def test_validate_date():
    """Test date validation"""
    # Test valid date
    assert validate_date("2024-01-01") == "2024-01-01"

    # Test None input
    assert validate_date(None) is None

    # Test invalid format
    with pytest.raises(BadRequest):
        validate_date("01-01-2024")

    # Test invalid date
    with pytest.raises(BadRequest):
        validate_date("2024-13-01")


def test_validate_year():
    """Test year validation"""
    current_year = datetime.now().year

    # Test valid year
    assert validate_year(2024) == 2024
    assert validate_year("2024") == 2024

    # Test None input
    assert validate_year(None) is None

    # Test invalid year (future)
    with pytest.raises(BadRequest):
        validate_year(current_year + 1)

    # Test invalid year (too old)
    with pytest.raises(BadRequest):
        validate_year(1999)

    # Test invalid format
    with pytest.raises(BadRequest):
        validate_year("invalid")


def test_validate_id():
    """Test ID validation"""
    # Test valid IDs
    assert validate_id(1) == 1
    assert validate_id("42") == 42

    # Test None input
    assert validate_id(None) is None

    # Test invalid ID (negative)
    with pytest.raises(BadRequest):
        validate_id(-1)

    # Test invalid ID (zero)
    with pytest.raises(BadRequest):
        validate_id(0)

    # Test invalid format
    with pytest.raises(BadRequest):
        validate_id("invalid")


def test_validate_limit():
    """Test limit validation"""
    # Test valid limits
    assert validate_limit(100) == 100
    assert validate_limit("50") == 50

    # Test None input (default)
    assert validate_limit(None) == 100

    # Test invalid limit (negative)
    with pytest.raises(BadRequest):
        validate_limit(-1)

    # Test invalid limit (zero)
    with pytest.raises(BadRequest):
        validate_limit(0)

    # Test invalid limit (exceeds max)
    with pytest.raises(BadRequest):
        validate_limit(2000, max_limit=1000)

    # Test invalid format
    with pytest.raises(BadRequest):
        validate_limit("invalid")


def test_validate_group_by():
    """Test group_by validation"""
    allowed_values = ["store", "department", "date"]

    # Test valid value
    assert validate_group_by("store", allowed_values) == "store"

    # Test invalid value
    with pytest.raises(BadRequest):
        validate_group_by("invalid", allowed_values)

    # Test None input
    with pytest.raises(BadRequest):
        validate_group_by(None, allowed_values)


def test_validate_time_period():
    """Test time_period validation"""
    allowed_values = ["daily", "weekly", "monthly", "yearly"]

    # Test valid value
    assert validate_time_period("weekly", allowed_values) == "weekly"

    # Test invalid value
    with pytest.raises(BadRequest):
        validate_time_period("invalid", allowed_values)

    # Test None input
    with pytest.raises(BadRequest):
        validate_time_period(None, allowed_values)


def test_format_response():
    """Test response formatting"""
    # Test basic response
    data = {"key": "value"}
    response = format_response(data)
    assert response == {"status": "success", "data": data}

    # Test response with message
    response = format_response(data, message="Test message")
    assert response == {"status": "success", "data": data, "message": "Test message"}

    # Test response with different status
    response = format_response(data, status="error")
    assert response == {"status": "error", "data": data}


def test_api_errors():
    """Test API error classes"""
    # Test APIError
    error = APIError("Test error", 400)
    assert error.message == "Test error"
    assert error.status_code == 400
    assert error.to_dict() == {"message": "Test error", "status": "error"}

    # Test ValidationError
    error = ValidationError("Invalid input")
    assert error.message == "Invalid input"
    assert error.status_code == 400

    # Test DatabaseError
    error = DatabaseError()
    assert error.message == "Database error occurred"
    assert error.status_code == 500

    # Test NotFoundError
    error = NotFoundError()
    assert error.message == "Resource not found"
    assert error.status_code == 404
