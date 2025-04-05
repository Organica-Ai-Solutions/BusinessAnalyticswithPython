from flask import Flask, jsonify
from flask_cors import CORS

from src.routes.analytics import analytics_bp
from src.routes.sales import sales_bp
from src.utils.docs import ANALYTICS_DOCS, SALES_DOCS
from src.utils.error_handlers import register_error_handlers


def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)

    # Enable CORS
    CORS(app)

    # Register error handlers
    register_error_handlers(app)

    # Register blueprints
    app.register_blueprint(sales_bp, url_prefix="/api/sales")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    # API documentation endpoint
    @app.route("/api/docs")
    def get_docs():
        """Get API documentation"""
        return jsonify(
            {
                "status": "success",
                "data": {"analytics": ANALYTICS_DOCS, "sales": SALES_DOCS},
            }
        )

    # Health check endpoint
    @app.route("/health")
    def health_check():
        """Health check endpoint"""
        return jsonify({"status": "success", "message": "Service is healthy"})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
