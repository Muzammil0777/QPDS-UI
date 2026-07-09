from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity, verify_jwt_in_request
import uuid
from datetime import datetime, timedelta
from ..models import User, FacultyAssignment, CourseOutcome, Subject, db

bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required():
    claims = get_jwt()
    # Permit ADMIN and SUPER_ADMIN for administrative requests
    return claims.get('role') in ['SUPER_ADMIN', 'ADMIN']

@bp.before_request
def check_admin():
    # Allow CORS preflight requests
    if request.method == 'OPTIONS':
        return

    # Verify JWT manually for non-OPTIONS requests
    try:
        verify_jwt_in_request()
    except Exception as e:
        return jsonify({'error': str(e)}), 401

    if not admin_required():
         return jsonify({'error': 'Admin privilege required'}), 403

@bp.route('/faculty', methods=['GET'])
def get_faculty():
    # List all users with system role ACADEMIC or FACULTY
    faculty_list = User.query.filter(User.role.in_(['ACADEMIC', 'FACULTY'])).all()
    
    result = []
    for f in faculty_list:
        data = f.to_dict()
        # Fetch dynamic subject assignments
        assigned = db.session.query(Subject).join(FacultyAssignment).filter(
            FacultyAssignment.user_id == f.id,
            FacultyAssignment.is_active == True,
            FacultyAssignment.valid_from <= datetime.utcnow(),
            FacultyAssignment.valid_until >= datetime.utcnow()
        ).all()
        # Format: "Code - Name"
        data['subjects'] = [f"{s.code} - {s.name}" for s in assigned]
        result.append(data)

    return jsonify(result), 200

@bp.route('/approve/<uuid:faculty_id>', methods=['POST'])
def approve_faculty(faculty_id):
    user = User.query.get_or_404(faculty_id)
    if user.role not in ['ACADEMIC', 'FACULTY']:
        return jsonify({'error': 'User is not an academic profile'}), 400
        
    user.is_approved = True
    db.session.commit()
    return jsonify({'message': f'Faculty {user.name} approved'}), 200

@bp.route('/deny/<uuid:faculty_id>', methods=['POST'])
def deny_faculty(faculty_id):
    # Deny request = Delete the user account
    user = User.query.get_or_404(faculty_id)
    if user.role not in ['ACADEMIC', 'FACULTY']:
         return jsonify({'error': 'User is not an academic profile'}), 400
    
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
    if 'role' in data:
        # Super Admin / Admin can elevate roles
        new_role = data['role']
        if new_role in ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC']:
            user.role = new_role
    
    db.session.commit()
    return jsonify({'message': 'Faculty details updated'}), 200

@bp.route('/deactivate-user/<uuid:faculty_id>', methods=['PUT'])
def deactivate_faculty(faculty_id):
    user = User.query.get_or_404(faculty_id)
    if user.role not in ['ACADEMIC', 'FACULTY']:
        return jsonify({'error': 'User is not an academic profile'}), 400
        
    user.is_active = False
    db.session.commit()
    return jsonify({'message': f'Faculty {user.name} has been deactivated'}), 200

@bp.route('/reactivate-user/<uuid:faculty_id>', methods=['PUT'])
def reactivate_faculty(faculty_id):
    user = User.query.get_or_404(faculty_id)
    if user.role not in ['ACADEMIC', 'FACULTY']:
        return jsonify({'error': 'User is not an academic profile'}), 400
        
    user.is_active = True
    db.session.commit()
    return jsonify({'message': f'Faculty {user.name} has been reactivated'}), 200

@bp.route('/assign-subject', methods=['POST'])
def assign_subject():
    data = request.get_json()
    if not data or 'facultyId' not in data or 'subjectId' not in data:
        return jsonify({'error': 'Missing facultyId or subjectId'}), 400
        
    try:
        f_uuid = uuid.UUID(data['facultyId'])
        s_uuid = uuid.UUID(data['subjectId'])
    except ValueError:
        return jsonify({'error': 'Invalid ID format'}), 400

    faculty = User.query.get(f_uuid)
    subject = Subject.query.get(s_uuid)
    
    if not faculty or not subject:
        return jsonify({'error': 'Faculty or Subject not found'}), 404
        
    if faculty.role not in ['ACADEMIC', 'FACULTY']:
        return jsonify({'error': 'User is not legitimate academic member'}), 400
        
    if hasattr(faculty, 'is_active') and not faculty.is_active:
        return jsonify({'error': 'Cannot assign subject to deactivated academic member'}), 400
        
    # Check previous assignment
    exists = FacultyAssignment.query.filter_by(
        user_id=faculty.id,
        subject_id=subject.id,
        role_type='FACULTY'
    ).first()
    
    if exists:
        return jsonify({'message': 'Already assigned'}), 200
        
    admin_id = get_jwt_identity()
    now = datetime.utcnow()
    
    assignment = FacultyAssignment(
        user_id=faculty.id,
        subject_id=subject.id,
        role_type='FACULTY',
        valid_from=now,
        valid_until=now + timedelta(days=365), # 1 year validity
        assigned_by=uuid.UUID(admin_id),
        is_active=True
    )
    
    db.session.add(assignment)
    db.session.commit()
    
    return jsonify({'message': 'Subject assigned successfully'}), 201

@bp.route('/course-outcomes', methods=['POST'])
def create_course_outcome():
    data = request.get_json()
    
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

@bp.route('/course-outcomes/subject/<uuid:subject_id>', methods=['GET'])
def get_course_outcomes(subject_id):
    outcomes = CourseOutcome.query.filter_by(subject_id=subject_id).all()
    return jsonify([co.to_dict() for co in outcomes]), 200

@bp.route('/course-outcomes/<uuid:co_id>', methods=['PUT'])
def update_course_outcome(co_id):
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
