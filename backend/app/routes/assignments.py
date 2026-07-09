import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from ..models import db, User, Subject, FacultyAssignment

bp = Blueprint('assignments', __name__, url_prefix='/api/assignments')

def admin_required():
    claims = get_jwt()
    return claims.get('role') in ['SUPER_ADMIN', 'ADMIN']

@bp.before_request
@jwt_required()
def check_admin_privilege():
    if request.method == 'OPTIONS':
        return
    if not admin_required():
        return jsonify({'error': 'Unauthorized: Administrator access required.'}), 403

@bp.route('', methods=['GET'])
def get_assignments():
    try:
        user_id = request.args.get('userId')
        subject_id = request.args.get('subjectId')
        role_type = request.args.get('roleType')

        query = FacultyAssignment.query
        if user_id:
            query = query.filter_by(user_id=uuid.UUID(user_id))
        if subject_id:
            query = query.filter_by(subject_id=uuid.UUID(subject_id))
        if role_type:
            query = query.filter_by(role_type=role_type)

        assignments = query.all()
        result = []
        for a in assignments:
            item = a.to_dict()
            # Attach details for display
            u = User.query.get(a.user_id)
            sub = Subject.query.get(a.subject_id) if a.subject_id else None
            delegated_from = User.query.get(a.delegated_from_user_id) if a.delegated_from_user_id else None
            
            item['userName'] = u.name if u else 'Unknown'
            item['userEmail'] = u.email if u else ''
            item['subjectCode'] = sub.code if sub else 'N/A'
            item['subjectName'] = sub.name if sub else 'N/A'
            item['delegatedFromName'] = delegated_from.name if delegated_from else None
            result.append(item)

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('', methods=['POST'])
def create_assignment():
    try:
        data = request.get_json()
        user_id = data.get('userId')
        role_type = data.get('roleType')
        valid_until_str = data.get('validUntil')

        if not user_id or not role_type or not valid_until_str:
            return jsonify({'error': 'Missing required fields: userId, roleType, validUntil'}), 400

        valid_from_str = data.get('validFrom')
        if valid_from_str:
            valid_from = datetime.fromisoformat(valid_from_str.replace('Z', '+00:00'))
        else:
            valid_from = datetime.utcnow()

        valid_until = datetime.fromisoformat(valid_until_str.replace('Z', '+00:00'))

        if valid_until <= valid_from:
            return jsonify({'error': 'validUntil must be strictly after validFrom'}), 400

        # Validate existence of target user
        target_user = User.query.get(uuid.UUID(user_id))
        if not target_user:
            return jsonify({'error': 'Target user not found'}), 404

        subject_id = data.get('subjectId')
        s_uuid = uuid.UUID(subject_id) if subject_id else None
        
        department = data.get('department')
        delegated_from_user_id = data.get('delegatedFromUserId')
        df_uuid = uuid.UUID(delegated_from_user_id) if delegated_from_user_id else None

        # Check for previous assignment to prevent duplication
        exists = FacultyAssignment.query.filter_by(
            user_id=target_user.id,
            subject_id=s_uuid,
            department=department,
            role_type=role_type
        ).first()

        admin_id = get_jwt_identity()

        if exists:
            # Update existing rather than creating duplicate
            exists.valid_from = valid_from
            exists.valid_until = valid_until
            exists.delegated_from_user_id = df_uuid
            exists.assigned_by = uuid.UUID(admin_id)
            exists.is_active = True
            db.session.commit()
            return jsonify({'message': 'Assignment updated successfully', 'assignment': exists.to_dict()}), 200

        assignment = FacultyAssignment(
            user_id=target_user.id,
            subject_id=s_uuid,
            department=department,
            role_type=role_type,
            valid_from=valid_from,
            valid_until=valid_until,
            delegated_from_user_id=df_uuid,
            assigned_by=uuid.UUID(admin_id),
            is_active=True
        )

        db.session.add(assignment)
        db.session.commit()
        return jsonify({'message': 'Assignment created successfully', 'assignment': assignment.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<uuid:id>', methods=['PUT'])
def update_assignment(id):
    try:
        a = FacultyAssignment.query.get_or_404(id)
        data = request.get_json()

        if 'validFrom' in data:
            a.valid_from = datetime.fromisoformat(data['validFrom'].replace('Z', '+00:00'))
        if 'validUntil' in data:
            a.valid_until = datetime.fromisoformat(data['validUntil'].replace('Z', '+00:00'))
        if 'isActive' in data:
            a.is_active = bool(data['isActive'])
        if 'delegatedFromUserId' in data:
            df_uid = data['delegatedFromUserId']
            a.delegated_from_user_id = uuid.UUID(df_uid) if df_uid else None

        db.session.commit()
        return jsonify({'message': 'Assignment updated successfully', 'assignment': a.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<uuid:id>', methods=['DELETE'])
def delete_assignment(id):
    try:
        a = FacultyAssignment.query.get_or_404(id)
        db.session.delete(a)
        db.session.commit()
        return jsonify({'message': 'Assignment removed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
