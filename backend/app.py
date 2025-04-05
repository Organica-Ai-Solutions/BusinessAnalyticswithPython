import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from src.database.db import initialize_db
from src.routes.sales import sales_bp
from src.routes.analytics import analytics_bp
from src.routes.dashboard import dashboard_bp
from src.routes.reports import reports_bp
import ssl

app = Flask(__name__)

# Configure Socket.IO with CORS settings
socketio = SocketIO(
    app,
    cors_allowed_origins=["https://localhost:3000"],
    async_mode='eventlet',  # Change to eventlet mode
    ping_timeout=5000,
    ping_interval=25000,
    logger=True,  # Enable logging
    engineio_logger=True  # Enable Engine.IO logging
)

# Configure CORS to allow requests from frontend
CORS(app, resources={
    r"/*": {  # Allow CORS for all routes
        "origins": ["https://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type", "Authorization"]
    }
})

# Register blueprints
app.register_blueprint(sales_bp, url_prefix='/api/sales')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(reports_bp, url_prefix='/api/reports')

@app.route('/')
def home():
    return jsonify({"message": "Retail Analytics API"})

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    socketio.emit('connection_status', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('message')
def handle_message(message):
    print('Received message:', message)
    socketio.emit('message', {'data': message})

if __name__ == '__main__':
    # Initialize database
    initialize_db()
    
    # Create SSL context
    # context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    # context.load_cert_chain('cert.pem', 'key.pem')
    
    # Run with SSL
    socketio.run(
        app,
        host='0.0.0.0',
        port=5001,  # Changed port to 5001
        debug=True,
        # ssl_context=context,
        use_reloader=False  # Disable reloader when using SSL
    ) 