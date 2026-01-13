from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, verify_jwt_in_request
from ..services import subject_service
from ..models import Subject, AcademicYear, Semester, CourseOutcome, db

bp = Blueprint('subjects', __name__, url_prefix='/api/subjects')

@bp.route('', methods=['GET'])
def get_subjects():
    filters = {
        'semester': request.args.get('semester'),
        'academicYear': request.args.get('academicYear')
    }
    
    subjects = subject_service.get_subjects(filters)
    
    # Serialize subjects
    result = []
    for s in subjects:
        result.append({
            "id": str(s.id),
            "code": s.code,
            "name": s.name,
            "semester": s.semester.number,
            "academicYear": s.academic_year.label
        })
        
    return jsonify(result), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_subject():
    # Admin check?
    claims = get_jwt()
    if claims.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin required'}), 403

    data = request.get_json()
    # Expect: code, name, semester, academic_year
    
    if not all(k in data for k in ['code', 'name', 'semester', 'academic_year']):
        return jsonify({'error': 'Missing required fields'}), 400
        
    # Get/Create Academic Year
    ay_label = data['academic_year']
    ay = AcademicYear.query.filter_by(label=ay_label).first()
    if not ay:
        try:
            parts = ay_label.split('-')
            start = int(parts[0])
            end = int(parts[1])
        except:
             return jsonify({'error': 'Invalid Academic Year format (expected YYYY-YYYY)'}), 400
        ay = AcademicYear(label=ay_label, start_year=start, end_year=end)
        db.session.add(ay)
        db.session.flush()
        
    # Get/Create Semester
    sem_num = int(data['semester'])
    sem = Semester.query.filter_by(number=sem_num).first()
    if not sem:
        sem = Semester(number=sem_num)
        db.session.add(sem)
        db.session.flush()
        
    # Check if subject exists
    exists = Subject.query.filter_by(code=data['code'], semester_id=sem.id, academic_year_id=ay.id).first()
    if exists:
        return jsonify({'error': 'Subject already exists'}), 400
        
    new_sub = Subject(
        code=data['code'],
        name=data['name'],
        semester_id=sem.id,
        academic_year_id=ay.id
    )
    db.session.add(new_sub)
    db.session.commit()
    
    return jsonify({'message': 'Subject created'}), 201

@bp.route('/<uuid:subject_id>/course-outcomes', methods=['GET'])
@jwt_required()
def get_subject_outcomes(subject_id):
    outcomes = CourseOutcome.query.filter_by(subject_id=subject_id).all()
    return jsonify([co.to_dict() for co in outcomes]), 200
