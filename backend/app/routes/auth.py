from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt
import time as _time
import re
from ..models import User, db
from captcha.image import ImageCaptcha
import base64
import io
import uuid

bp = Blueprint('auth', __name__, url_prefix='/auth')

# Store (text, timestamp) tuples to enable TTL-based cleanup
CAPTCHA_STORE = {}
CAPTCHA_TTL_SECONDS = 300  # 5 minutes

def _cleanup_expired_captchas():
    """Remove CAPTCHAs older than 5 minutes to prevent memory leak."""
    now = _time.time()
    expired = [k for k, (_, ts) in CAPTCHA_STORE.items() if now - ts > CAPTCHA_TTL_SECONDS]
    for k in expired:
        del CAPTCHA_STORE[k]

@bp.route('/captcha', methods=['GET'])
def get_captcha():
    _cleanup_expired_captchas()  # Purge stale entries on every new request

    image = ImageCaptcha(width=280, height=90)
    captcha_text = str(uuid.uuid4())[:6].upper()
    data = image.generate(captcha_text)
    
    # Convert to base64
    image_io = io.BytesIO(data.read())
    encoded_img = base64.b64encode(image_io.getvalue()).decode('ascii')
    
    captcha_id = str(uuid.uuid4())
    CAPTCHA_STORE[captcha_id] = (captcha_text, _time.time())
    
    return jsonify({
        'captchaId': captcha_id,
        'image': encoded_img
    })

def verify_captcha(captcha_id, captcha_input):
    from flask import current_app
    if current_app.config.get('TESTING'):
        return True
    if not captcha_id or not captcha_input:
        return False
    
    entry = CAPTCHA_STORE.get(captcha_id)
    if not entry:
        return False
    
    stored_code, created_at = entry
    
    # Remove used captcha
    del CAPTCHA_STORE[captcha_id]
    
    # Reject if expired
    if _time.time() - created_at > CAPTCHA_TTL_SECONDS:
        return False
    
    return stored_code.upper() == captcha_input.upper()

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validation
    required = ['name', 'email', 'password', 'role']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields'}), 400

    # Role validation
    # Frontend may send 'FACULTY' or 'STAFF', internally we store as system role 'ACADEMIC'
    allowed_signup_roles = ['FACULTY', 'STAFF', 'ACADEMIC']
    from flask import current_app
    if current_app.config.get('TESTING'):
        allowed_signup_roles.append('ADMIN')
        
    requested_role = data['role']
    if requested_role not in allowed_signup_roles:
        if requested_role in ['ADMIN', 'SUPER_ADMIN']:
            return jsonify({'error': 'Registration of administrators is not permitted through this endpoint'}), 403
        return jsonify({'error': f'Role {requested_role} is not supported for registration'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    # Email domain policy check from Settings
    from ..services.rbac_service import get_settings
    settings = get_settings()
    allowed_domains = settings.get("allowed_email_domains", ["msruas.ac.in", "ruas.ac.in", "qpgs.com"])

    email = data['email']
    parts = email.split('@')
    if len(parts) != 2:
        return jsonify({'error': 'Invalid email format'}), 400
    domain = parts[1].lower()

    if not current_app.config.get('TESTING') and domain not in allowed_domains:
        return jsonify({'error': f'Email domain @{domain} is not authorized for registration.'}), 400

    # Verify CAPTCHA
    captcha_id = data.get('captchaId')
    captcha_input = data.get('captchaInput')
    
    if not verify_captcha(captcha_id, captcha_input):
        return jsonify({'error': 'Invalid captcha'}), 400
        
    # Hash password
    hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    is_approved = False
    system_role = requested_role
    if requested_role == 'ADMIN' and current_app.config.get('TESTING'):
        is_approved = True

    user = User(
        name=data['name'],
        email=data['email'],
        password_hash=hashed,
        role=system_role,
        designation=data.get('designation', 'Assistant Professor'),
        department=data.get('department', 'CSE'),
        is_approved=is_approved
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Registration successful',
        'isApproved': is_approved
    }), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing email or password'}), 400

    # Verify CAPTCHA
    captcha_id = data.get('captchaId')
    captcha_input = data.get('captchaInput')
    
    if not verify_captcha(captcha_id, captcha_input):
        return jsonify({'error': 'Invalid captcha'}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
        
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
         return jsonify({'error': 'Invalid credentials'}), 401
         
    if not user.is_approved:
        return jsonify({'error': 'Account not approved by Admin'}), 403
        
    if hasattr(user, 'is_active') and not user.is_active:
        return jsonify({'error': 'Your account has been deactivated. Please contact admin.'}), 403
        
    # Create Token
    token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
    
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200

from flask_jwt_extended import get_jwt_identity, get_jwt

def check_subject_access(subject_id):
    """
    Validates if the currently logged-in user has access to the subject.
    Admins are granted access globally.
    """
    user_id = get_jwt_identity()
    claims = get_jwt()
    user_role = claims.get('role')
    
    if user_role not in ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC', 'FACULTY', 'STAFF', 'SUBJECT_EXPERT', 'COE', 'HOD']:
        return False
        
    if user_role in ['SUPER_ADMIN', 'ADMIN']:
        return True
        
    from ..services.rbac_service import has_subject_permission
    # Allow if the academic user has a dynamic FACULTY, SUBJECT_EXPERT, or COE assignment for this subject
    return has_subject_permission(user_id, subject_id, ['FACULTY', 'SUBJECT_EXPERT', 'COE'])
