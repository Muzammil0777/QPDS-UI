from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import bcrypt
import time as _time
from ..models import User, db
from captcha.image import ImageCaptcha
import base64
import io
import uuid

bp = Blueprint('auth', __name__, url_prefix='/auth')

# Fix #4: Store (text, timestamp) tuples to enable TTL-based cleanup
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
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    # Faculty Email Policy
    if data['role'] == 'FACULTY':
         from flask import current_app
         import re
         # Regex: Start with alphanumeric/dots/underscores, MUST end with .cs.et@msruas.ac.in
         pattern = r'^[a-zA-Z0-9._]+(\.cs\.et@msruas\.ac\.in)$'
         if not current_app.config.get('TESTING') and not re.match(pattern, data['email']):
              return jsonify({'error': 'Invalid email. Must be a faculty email (e.g., name.cs.et@msruas.ac.in)'}), 400

    # Verify CAPTCHA
    captcha_id = data.get('captchaId')
    captcha_input = data.get('captchaInput')
    
    if not verify_captcha(captcha_id, captcha_input):
        return jsonify({'error': 'Invalid captcha'}), 400
        
    # Hash password
    hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Default is_approved is False for Faculty
    is_approved = False
    if data['role'] == 'ADMIN':
         # In a real app, we shouldn't allow creating ADMINs openly, but for this demo/MVP:
         is_approved = True 
    
    user = User(
        name=data['name'],
        email=data['email'],
        password_hash=hashed,
        role=data['role'],
        designation=data.get('designation'),
        department=data.get('department'),
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
