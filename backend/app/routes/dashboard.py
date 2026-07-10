import uuid
from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from ..models import db, User, Subject, FacultyAssignment, Question, Paper

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@bp.route('/academic', methods=['GET'])
@jwt_required()
def get_academic_dashboard():
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')

        from ..services.rbac_service import to_uuid
        u_uuid = to_uuid(user_id)
        user = User.query.get(u_uuid)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        now = datetime.utcnow()
        # Find active assignments
        assignments = FacultyAssignment.query.filter(
            FacultyAssignment.user_id == u_uuid,
            FacultyAssignment.is_active == True,
            FacultyAssignment.valid_from <= now,
            FacultyAssignment.valid_until >= now
        ).all()

        active_roles = set()
        if user.role in ['SUPER_ADMIN', 'ADMIN']:
            active_roles.update(['FACULTY', 'SUBJECT_EXPERT', 'HOD', 'COE', 'STAFF'])
        else:
            for a in assignments:
                active_roles.add(a.role_type)
            if user.role in ['FACULTY', 'STAFF', 'ACADEMIC']:
                # Support legacy role names on user model
                active_roles.add(user.role)

        result = {
            'systemRole': user.role,
            'activeRoles': list(active_roles),
            'facultySubjects': [],
            'expertSubjects': [],
            'hodStats': None,
            'coePapers': [],
            'staffTracker': []
        }

        # 1. FACULTY: Fetch assigned subjects
        fac_subject_ids = {a.subject_id for a in assignments if a.role_type == 'FACULTY' and a.subject_id}

        # Resolve subjects strictly from actual database mapping
        fac_subjects = Subject.query.filter(Subject.id.in_(fac_subject_ids)).all() if fac_subject_ids else []

        for sub in fac_subjects:
            result['facultySubjects'].append({
                'id': str(sub.id),
                'code': sub.code,
                'name': sub.name,
                'semester': sub.semester.number if sub.semester else 5,
                'academic_year': sub.academic_year.label if sub.academic_year else '2024-2025'
            })

        # 2. SUBJECT_EXPERT: Fetch review list
        expert_subject_ids = {a.subject_id for a in assignments if a.role_type == 'SUBJECT_EXPERT' and a.subject_id}
        # Resolve subjects strictly from actual database mapping
        expert_subjects = Subject.query.filter(Subject.id.in_(expert_subject_ids)).all() if expert_subject_ids else []

        for sub in expert_subjects:
            pending_count = Question.query.filter(Question.subject_id == sub.id, Question.status != 'APPROVED').count()
            result['expertSubjects'].append({
                'id': str(sub.id),
                'code': sub.code,
                'name': sub.name,
                'pendingCount': pending_count
            })

        # 3. HOD: Fetch department statistics
        hod_depts = {a.department for a in assignments if a.role_type == 'HOD' and a.department}
        if hod_depts or user.role in ['SUPER_ADMIN', 'ADMIN']:
            target_dept = list(hod_depts)[0] if hod_depts else (user.department or 'CSE')
            
            total_subjects = Subject.query.count()
            total_questions = Question.query.count()
            approved_questions = Question.query.filter_by(status='APPROVED').count()

            result['hodStats'] = {
                'department': target_dept,
                'totalSubjects': total_subjects,
                'totalQuestions': total_questions,
                'approvedQuestions': approved_questions,
                'activeFaculty': User.query.filter(User.role.in_(['ACADEMIC', 'FACULTY'])).count()
            }

        # 4. COE: Fetch paper list
        if 'COE' in active_roles or user.role in ['SUPER_ADMIN', 'ADMIN']:
            # Fetch last 5 exam papers
            papers = Paper.query.order_by(Paper.created_at.desc()).limit(5).all()
            result['coePapers'] = [{
                'id': str(p.id),
                'title': p.title,
                'status': p.status,
                'subjectCode': p.subject.code if p.subject else 'N/A',
                'createdAt': p.created_at.isoformat()
            } for p in papers]

        # 5. STAFF: Central review tracker
        if 'STAFF' in active_roles or user.role in ['SUPER_ADMIN', 'ADMIN']:
            all_subjects = Subject.query.all()
            for sub in all_subjects:
                total = Question.query.filter_by(subject_id=sub.id).count()
                approved = Question.query.filter_by(subject_id=sub.id, status='APPROVED').count()
                pending = Question.query.filter_by(subject_id=sub.id, status='PENDING_REVIEW').count()
                result['staffTracker'].append({
                    'subjectCode': sub.code,
                    'subjectName': sub.name,
                    'totalQuestions': total,
                    'approvedQuestions': approved,
                    'pendingQuestions': pending,
                    'completionPercentage': int((approved / total * 100)) if total > 0 else 0
                })

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
