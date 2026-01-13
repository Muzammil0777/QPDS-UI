from flask import Blueprint, jsonify, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from ..models import Subject, FacultySubject, User, db

bp = Blueprint('faculty', __name__, url_prefix='/faculty')

@bp.route('/my-subjects', methods=['GET'])
@jwt_required()
def get_my_subjects():
    user_id = get_jwt_identity()
    
    # Query assigned subjects
    assigned = db.session.query(Subject)\
        .join(FacultySubject)\
        .filter(FacultySubject.faculty_id == user_id)\
        .all()
        
    result = []
    for s in assigned:
        result.append({
            "id": str(s.id),
            "code": s.code,
            "name": s.name,
            "semester": s.semester.number,
            "academic_year": s.academic_year.label
        })
        
    return jsonify(result), 200

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_faculty():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/profile-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        user_id = get_jwt_identity()
        filename = secure_filename(f"{user_id}_{file.filename}")
        
        # Save to static/uploads or similar
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        # Update user record
        user = User.query.get(user_id)
        if user:
            # Construct URL (assuming static serve)
            # In a real app we might serve via a route or Nginx
            # For now, let's serve via a specific route or Flask static
            # Flask default static folder is 'app/static'
            # URL: /static/uploads/...
            relative_path = f"static/uploads/{filename}"
            user.profile_picture = relative_path
            db.session.commit()
            return jsonify({'message': 'Profile picture uploaded', 'url': relative_path}), 200
        else:
            return jsonify({'error': 'User not found'}), 404
            
    return jsonify({'error': 'Invalid file type'}), 400
