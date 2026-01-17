from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity, verify_jwt_in_request
import uuid
from ..models import User, FacultySubject, CourseOutcome, Subject, db

bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required():
    claims = get_jwt()
    if claims.get('role') != 'ADMIN':
        return False
    return True

@bp.before_request
def check_admin():
    # Allow CORS preflight requests
    if request.method == 'OPTIONS':
        return
        
    # debug bypass
    if request.endpoint and 'debug_faculty' in request.endpoint:
        return

    # Verify JWT manually for non-OPTIONS requests
    try:
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({'error': str(e)}), 401

    if not admin_required():
         return jsonify({'error': 'Admin privilege required'}), 403

@bp.route('/debug-faculty', methods=['GET'])
def debug_faculty():
    # Public debug route
    all_users = User.query.all()
    filtered_by = User.query.filter_by(role='FACULTY').all()
    filter_equals = User.query.filter(User.role == 'FACULTY').all()
    filter_ilike = User.query.filter(User.role.ilike('faculty')).all()
    
    # Check for whitespace
    roles = [f"'{u.role}'" for u in all_users]
    
    return jsonify({
        "total": len(all_users),
        "filtered_by": len(filtered_by),
        "filter_equals": len(filter_equals),
        "filter_ilike": len(filter_ilike),
        "roles_debug": roles
    }), 200

@bp.route('/faculty', methods=['GET'])
def get_faculty():
    # List all users with role FACULTY
    all_users = User.query.all()
    print(f"DEBUG: All users: {len(all_users)} -> {[u.role for u in all_users]}")
    
    faculty_list = User.query.filter_by(role='FACULTY').all()
    print(f"DEBUG: Faculty found: {len(faculty_list)}")
    
    result = []
    for f in faculty_list:
        data = f.to_dict()
        # Fetch subjects
        assigned = db.session.query(Subject).join(FacultySubject).filter(FacultySubject.faculty_id == f.id).all()
        # Format: "Code - Name"
        data['subjects'] = [f"{s.code} - {s.name}" for s in assigned]
        result.append(data)

    return jsonify(result), 200

@bp.route('/approve/<uuid:faculty_id>', methods=['POST'])
def approve_faculty(faculty_id):
    user = User.query.get_or_404(faculty_id)
    if user.role != 'FACULTY':
        return jsonify({'error': 'User is not faculty'}), 400
        
    user.is_approved = True
    db.session.commit()
    return jsonify({'message': f'Faculty {user.name} approved'}), 200

@bp.route('/deny/<uuid:faculty_id>', methods=['POST'])
def deny_faculty(faculty_id):
    # Deny request = Delete the user account
    user = User.query.get_or_404(faculty_id)
    if user.role != 'FACULTY':
         return jsonify({'error': 'User is not faculty'}), 400
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': f'Faculty request for {user.name} denied/deleted'}), 200

@bp.route('/faculty/<uuid:faculty_id>', methods=['PUT'])
def update_faculty(faculty_id):
    user = User.query.get_or_404(faculty_id)
    data = request.get_json()
    
    if 'name' in data:
        user.name = data['name']
    if 'designation' in data:
        user.designation = data['designation']
    
    db.session.commit()
    return jsonify({'message': 'Faculty details updated'}), 200

@bp.route('/faculty/<uuid:faculty_id>', methods=['DELETE'])
def delete_faculty(faculty_id):
    user = User.query.get_or_404(faculty_id)
    
    # Optional: Manually remove assignments if not cascaded
    FacultySubject.query.filter_by(faculty_id=user.id).delete()
    
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Faculty deleted successfully'}), 200

@bp.route('/assign-subject', methods=['POST'])
def assign_subject():
    data = request.get_json()
    if not data or 'facultyId' not in data or 'subjectId' not in data:
        return jsonify({'error': 'Missing facultyId or subjectId'}), 400
        
    # Check existence
    try:
        f_uuid = uuid.UUID(data['facultyId'])
        s_uuid = uuid.UUID(data['subjectId'])
    except ValueError:
        return jsonify({'error': 'Invalid ID format'}), 400

    faculty = User.query.get(f_uuid)
    subject = Subject.query.get(s_uuid)
    
    if not faculty or not subject:
        return jsonify({'error': 'Faculty or Subject not found'}), 404
        
    if faculty.role != 'FACULTY':
        return jsonify({'error': 'User is not legitimate faculty'}), 400
        
    # Check previous assignment
    exists = FacultySubject.query.filter_by(faculty_id=faculty.id, subject_id=subject.id).first()
    if exists:
        return jsonify({'message': 'Already assigned'}), 200
        
    admin_id = get_jwt_identity()
    
    assignment = FacultySubject(
        faculty_id=faculty.id,
        subject_id=subject.id,
        assigned_by=uuid.UUID(admin_id)
    )
    
    db.session.add(assignment)
    db.session.commit()
    
    return jsonify({'message': 'Subject assigned successfully'}), 201

@bp.route('/course-outcomes', methods=['POST'])
def create_course_outcome():
    data = request.get_json()
    # Expecting [ { "subjectId": "...", "coCode": "CO1", "description": "..." }, ... ] or single
    
    if isinstance(data, dict):
        data = [data]
        
    created_count = 0
    errors = []
    
    for item in data:
        sub_id = item.get('subjectId')
        code = item.get('coCode')
        desc = item.get('description')
        
        if not all([sub_id, code, desc]):
            errors.append(f"Missing fields in item: {item}")
            continue
            
        try:
            sub_uuid = uuid.UUID(sub_id)
        except ValueError:
            errors.append(f"Invalid Subject ID for item: {item}")
            continue

        # Validate Subject Exists
        subject = Subject.query.get(sub_uuid)
        if not subject:
            errors.append(f"Subject not found for item: {item}")
            continue

        # Check if exists
        exists = CourseOutcome.query.filter_by(subject_id=sub_uuid, co_code=code).first()
        if exists:
             # update description
             exists.description = desc
        else:
            co = CourseOutcome(
                subject_id=sub_uuid,
                co_code=code,
                description=desc
            )
            db.session.add(co)
            created_count += 1
            
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
        
    return jsonify({'message': f'Processed {len(data)} items. Created {created_count} new COs.', 'errors': errors}), 201

@bp.route('/course-outcomes/<uuid:subject_id>', methods=['GET'])
def get_course_outcomes(subject_id):
    outcomes = CourseOutcome.query.filter_by(subject_id=subject_id).all()
    return jsonify([co.to_dict() for co in outcomes]), 200

@bp.route('/course-outcomes/<uuid:co_id>', methods=['PUT'])
def update_course_outcome(co_id):
    # check_admin decorator handles auth
    co = CourseOutcome.query.get_or_404(co_id)
    data = request.get_json()
    
    if 'description' in data:
        co.description = data['description']
        
    db.session.commit()
    return jsonify({'message': 'Course Outcome updated'}), 200

@bp.route('/course-outcomes/<uuid:co_id>', methods=['DELETE'])
def delete_course_outcome(co_id):
    co = CourseOutcome.query.get_or_404(co_id)
    try:
        db.session.delete(co)
        db.session.commit()
        return jsonify({'message': 'Course Outcome deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
