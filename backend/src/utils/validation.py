from datetime import datetime
from typing import Any, Dict, Optional, Union

from werkzeug.exceptions import BadRequest


def validate_date(date_str: Optional[str], field_name: str = "date") -> Optional[str]:
    """Validate date string format (YYYY-MM-DD)"""
    if date_str is None:
        return None

    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return date_str
    except ValueError:
        raise BadRequest(f"Invalid {field_name} format. Use YYYY-MM-DD")


def validate_year(year: Optional[Union[str, int]], field_name: str = "year") -> Optional[int]:
    """Validate year value"""
    if year is None:
        return None

    try:
        year_int = int(year)
        current_year = datetime.now().year
        if year_int < 2000 or year_int > current_year:
            raise BadRequest(f"{field_name} must be between 2000 and {current_year}")
        return year_int
    except ValueError:
        raise BadRequest(f"Invalid {field_name} format")


def validate_id(id_value: Optional[Union[str, int]], field_name: str = "ID") -> Optional[int]:
    """Validate ID value"""
    if id_value is None:
        return None

    try:
        id_int = int(id_value)
        if id_int <= 0:
            raise BadRequest(f"{field_name} must be a positive number")
        return id_int
    except ValueError:
        raise BadRequest(f"Invalid {field_name} format")


def validate_limit(
    limit: Optional[Union[str, int]], max_limit: int = 1000
) -> Optional[int]:
    """Validate limit value"""
    if limit is None:
        return 100  # Default limit

    try:
        limit_int = int(limit)
        if limit_int <= 0:
            raise BadRequest("Limit must be a positive number")
        if limit_int > max_limit:
            raise BadRequest(f"Limit cannot exceed {max_limit}")
        return limit_int
    except ValueError:
        raise BadRequest("Invalid limit format")


def validate_group_by(group_by: str, allowed_values: list) -> str:
    """Validate group_by parameter"""
    if group_by not in allowed_values:
        raise BadRequest(
            f"Invalid group_by value. Must be one of: {', '.join(allowed_values)}"
        )
    return group_by


def validate_time_period(time_period: str, allowed_values: list) -> str:
    """Validate time_period parameter"""
    if time_period not in allowed_values:
        raise BadRequest(
            f"Invalid time_period value. Must be one of: {', '.join(allowed_values)}"
        )
    return time_period


def format_response(data: any, status: str = "success", message: str = None) -> dict:
    """Format API response"""
    response = {"status": status, "data": data}
    if message:
        response["message"] = message
    return response
