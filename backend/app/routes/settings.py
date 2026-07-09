from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from ..models import db, SystemSetting

bp = Blueprint('settings', __name__, url_prefix='/api/settings')

def super_admin_required():
    claims = get_jwt()
    # Require SUPER_ADMIN specifically for system configurations
    return claims.get('role') == 'SUPER_ADMIN'

@bp.before_request
@jwt_required()
def check_super_admin_privilege():
    if request.method == 'OPTIONS':
        return
    # Admins can view settings, but only SUPER_ADMIN can modify settings
    if request.method == 'GET':
        claims = get_jwt()
        if claims.get('role') not in ['SUPER_ADMIN', 'ADMIN']:
            return jsonify({'error': 'Unauthorized: Administrator access required.'}), 403
    elif not super_admin_required():
        return jsonify({'error': 'Unauthorized: Super Administrator access required.'}), 403

@bp.route('', methods=['GET'])
def get_settings():
    try:
        settings = SystemSetting.query.all()
        result = {s.key: s.value for s in settings}
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['PUT'])
def update_settings():
    try:
        data = request.get_json()
        if not data or not isinstance(data, dict):
            return jsonify({'error': 'Invalid request payload: expected key-value object.'}), 400

        for key, value in data.items():
            setting = SystemSetting.query.filter_by(key=key).first()
            if setting:
                setting.value = value
            else:
                setting = SystemSetting(key=key, value=value)
                db.session.add(setting)
        
        db.session.commit()
        
        # Return all settings after update
        settings = SystemSetting.query.all()
        result = {s.key: s.value for s in settings}
        return jsonify({'message': 'Settings updated successfully', 'settings': result}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
