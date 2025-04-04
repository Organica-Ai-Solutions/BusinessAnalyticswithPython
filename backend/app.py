from flask import Flask, jsonify
from flask_cors import CORS
from src.database.db import initialize_db
from src.routes.sales import sales_bp
from src.routes.analytics import analytics_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(sales_bp, url_prefix='/api/sales')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

@app.route('/')
def home():
    return jsonify({"message": "Retail Business Analytics API"})

if __name__ == '__main__':
    # Initialize database
    initialize_db()
    app.run(debug=True) 