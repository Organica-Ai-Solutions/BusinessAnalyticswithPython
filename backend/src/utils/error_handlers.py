from sqlite3 import Error as SQLiteError

from flask import jsonify
from werkzeug.exceptions import HTTPException


class APIError(Exception):
    """Base exception class for API errors"""

    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv["message"] = self.message
        rv["status"] = "error"
        return rv


class ValidationError(APIError):
    """Exception raised for validation errors"""

    pass


class DatabaseError(APIError):
    """Exception raised for database errors"""

    def __init__(self, message="Database error occurred", status_code=500):
        super().__init__(message, status_code)


class NotFoundError(APIError):
    """Exception raised for not found resources"""

    def __init__(self, message="Resource not found", status_code=404):
        super().__init__(message, status_code)


def register_error_handlers(app):
    """Register error handlers for the Flask app"""

    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(SQLiteError)
    def handle_sqlite_error(error):
        response = jsonify(
            {
                "status": "error",
                "message": "Database error occurred",
                "details": str(error),
            }
        )
        response.status_code = 500
        return response

    @app.errorhandler(404)
    def not_found_error(error):
        response = jsonify({"status": "error", "message": "Resource not found"})
        response.status_code = 404
        return response

    @app.errorhandler(400)
    def bad_request_error(error):
        response = jsonify({"status": "error", "message": str(error.description)})
        response.status_code = 400
        return response

    @app.errorhandler(500)
    def internal_server_error(error):
        response = jsonify(
            {"status": "error", "message": "An internal server error occurred"}
        )
        response.status_code = 500
        return response

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        response = jsonify(
            {
                "status": "error",
                "message": "An unexpected error occurred",
                "details": str(error),
            }
        )
        response.status_code = 500
        return response
