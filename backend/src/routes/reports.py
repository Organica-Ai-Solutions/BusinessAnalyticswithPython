from flask import Blueprint, jsonify

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('')
def get_reports_list():
    # Placeholder - return empty list for now
    return jsonify([])

@reports_bp.route('/scheduled')
def get_scheduled_reports():
    # Placeholder - return empty list for now
    return jsonify([])

# Add other report-related routes here later (create, delete, download) 