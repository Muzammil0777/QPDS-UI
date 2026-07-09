
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services import question_service
from ..models import Question # Assuming Question model is available for direct query

bp = Blueprint('questions', __name__, url_prefix='/api/questions')

@bp.route('', methods=['POST'])
@jwt_required()
def create_question():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
    
    # Updated validation: We need either subjectId OR (academicYear+semester+subcode)
    # AND editorData
    if 'editorData' not in data:
        return jsonify({'error': 'Missing editorData'}), 400
        
    has_subject_id = 'subjectId' in data
    has_legacy_meta = all(k in data for k in ['academicYear', 'semester', 'subcode'])
    
    if not has_subject_id and not has_legacy_meta:
        return jsonify({'error': 'Missing required fields: Provide subjectId'}), 400

    try:
        user_id = get_jwt_identity()
        result = question_service.create_question(data, user_id)
        # If service returns dict, return it. If object, call to_dict()
        if isinstance(result, dict):
            return jsonify(result), 201
        return jsonify(result.to_dict()), 201
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/bulk', methods=['POST'])
@jwt_required()
def create_bulk_questions():
    """
    Bulk save questions from AI.
    Expected Payload:
    {
      "subjectId": "uuid",
      "coIds": ["uuid", ...], # Optional, if we want to round-robin or assign to all
      "questions": [
         { "text": "Question text...", "type": "short/long" }, 
         ...
      ]
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    subject_id = data.get('subjectId')
    questions = data.get('questions', [])
    co_ids = data.get('coIds', [])
    
    if not subject_id or not questions:
        return jsonify({'error': 'Missing subjectId or questions list'}), 400
        
    try:
        user_id = get_jwt_identity()
        from ..models import User, db
        import uuid
        
        def parse_uuid(val):
            if not val:
                return None
            if isinstance(val, uuid.UUID):
                return val
            try:
                return uuid.UUID(str(val))
            except ValueError:
                return None

        u_uuid = parse_uuid(user_id)
        if not u_uuid:
            return jsonify({'error': 'Invalid User ID format'}), 400

        user = User.query.get(u_uuid)
        if not user or user.role != 'ADMIN':
            return jsonify({'error': 'Unauthorized: Only admins can bulk save AI questions'}), 403

        s_uuid = parse_uuid(subject_id)
        if not s_uuid:
            return jsonify({'error': 'Invalid subjectId format'}), 400

        # Optional metadata
        difficulty = data.get('difficulty', 'MEDIUM').upper()
        if difficulty not in ["EASY", "MEDIUM", "HARD"]:
            difficulty = "MEDIUM"

        # Simple bulk creation logic
        saved_count = 0

        assigned_co_id = parse_uuid(co_ids[0]) if co_ids else None
            
        from datetime import datetime
        import time

        from ..services.bloom_service import classify_bloom_level, map_to_difficulty

        for q_item in questions:
            q_text = q_item.get('text')
            if not q_text: 
                continue
                
            q_marks = q_item.get('marks')
            
            computed_bloom_level = classify_bloom_level(q_text)
            computed_difficulty = map_to_difficulty(computed_bloom_level)

            # Construct minimal EditorJS block
            editor_data = {
                "time": int(time.time() * 1000),
                "blocks": [
                    {
                        "id": "genAI" + str(saved_count),
                        "type": "paragraph",
                        "data": { "text": q_text }
                    }
                ],
                "version": "2.28.0",
                "meta": {
                    "marks": q_marks,
                    "difficulty": computed_difficulty,
                    "bloomLevel": computed_bloom_level
                }
            }
            
            q_co_id = parse_uuid(q_item.get('courseOutcomeId')) or assigned_co_id

            new_q = Question(
                subject_id=s_uuid,
                course_outcome_id=q_co_id, # Optional
                creator_id=u_uuid,
                source="AI",
                difficulty=computed_difficulty,
                bloom_level=computed_bloom_level,
                editor_data=editor_data,
                created_at=datetime.utcnow()
            )
            db.session.add(new_q)
            saved_count += 1
            
        db.session.commit()
        return jsonify({"message": f"Saved {saved_count} questions", "count": saved_count}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('', methods=['GET'])
@jwt_required()
def get_questions():
    from datetime import datetime, timedelta
    from ..models import Paper, QuestionUsage, db

    # Allow filtering by subject_id
    subject_id_str = request.args.get('subjectId')
    subject_id = None
    if subject_id_str:
        import uuid
        try:
            subject_id = uuid.UUID(str(subject_id_str))
        except ValueError:
            return jsonify({'error': 'Invalid subjectId format'}), 400

    creator_id_str = request.args.get('creatorId')
    creator_id = None
    if creator_id_str:
        import uuid
        try:
            creator_id = uuid.UUID(str(creator_id_str))
        except ValueError:
            return jsonify({'error': 'Invalid creatorId format'}), 400

    difficulty = request.args.get('difficulty')
    source = request.args.get('source')
    include_used = request.args.get('includeUsed', 'false').lower() == 'true'
    semester = request.args.get('semester')
    academic_year = request.args.get('academicYear')
    subcode = request.args.get('subcode')
    page = request.args.get('page', type=int)
    limit = request.args.get('limit', type=int)
    creator_name = request.args.get('creatorName')
    
    recently_used_ids_str = set()
    recently_used_ids_obj = set()

    if subject_id:
        last_papers = Paper.query.filter_by(subject_id=subject_id).order_by(Paper.created_at.desc()).limit(3).all()
        paper_ids = [p.id for p in last_papers]
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        usages_query = QuestionUsage.query.filter(
            QuestionUsage.subject_id == subject_id,
            db.or_(
                QuestionUsage.paper_id.in_(paper_ids) if paper_ids else db.false(),
                QuestionUsage.used_at >= thirty_days_ago
            )
        ).all()
        
        recently_used_ids_obj = {u.question_id for u in usages_query}
        recently_used_ids_str = {str(u.question_id) for u in usages_query}

    from flask_jwt_extended import get_jwt
    from .auth import check_subject_access

    user_id = get_jwt_identity()
    claims = get_jwt()
    user_role = claims.get('role')

    query = Question.query

    if user_role not in ['SUPER_ADMIN', 'ADMIN']:
        if subject_id:
            if not check_subject_access(subject_id):
                return jsonify({'error': 'You do not have access to this subject'}), 403
        else:
            from ..models import FacultyAssignment
            import uuid
            try:
                u_uuid = uuid.UUID(str(user_id))
            except ValueError:
                return jsonify({'error': 'Invalid User ID format'}), 400
            
            from datetime import datetime
            now = datetime.utcnow()
            assigned_subjects = FacultyAssignment.query.filter(
                FacultyAssignment.user_id == u_uuid,
                FacultyAssignment.is_active == True,
                FacultyAssignment.valid_from <= now,
                FacultyAssignment.valid_until >= now
            ).all()
            assigned_ids = [asub.subject_id for asub in assigned_subjects if asub.subject_id]
            # Resolved strictly from actual database mapping
            pass
            
            if not assigned_ids:
                return jsonify([]), 200
            query = query.filter(Question.subject_id.in_(assigned_ids))

    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if semester or academic_year or subcode:
        from ..models import Subject, AcademicYear, Semester
        query = query.join(Subject).join(AcademicYear).join(Semester)
        if semester:
            query = query.filter(Semester.number == int(semester))
        if academic_year:
            query = query.filter(AcademicYear.label == academic_year)
        if subcode:
            query = query.filter(Subject.code == subcode)
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    if source:
        query = query.filter_by(source=source)
    if creator_id:
        query = query.filter_by(creator_id=creator_id)
    if creator_name:
        from ..models import User
        query = query.filter(Question.creator.has(User.name.ilike(f'%{creator_name}%')))
        
    if not include_used and recently_used_ids_obj:
        query = query.filter(Question.id.not_in(list(recently_used_ids_obj)))
        
    if page and limit:
        questions_paginated = query.order_by(Question.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
        results = []
        for q in questions_paginated.items:
            q_dict = q.to_dict()
            q_dict['isRecentlyUsed'] = str(q.id) in recently_used_ids_str
            results.append(q_dict)
            
        return jsonify({
            'questions': results,
            'total': questions_paginated.total,
            'page': page,
            'pages': questions_paginated.pages
        }), 200
    else:
        questions = query.order_by(Question.created_at.desc()).all()
        
        results = []
        for q in questions:
            q_dict = q.to_dict()
            q_dict['isRecentlyUsed'] = str(q.id) in recently_used_ids_str
            results.append(q_dict)
            
        return jsonify(results), 200

@bp.route('/<question_id>', methods=['GET'])
@jwt_required()
def get_single_question(question_id):
    try:
        from ..models import db
        import uuid
        try:
            q_uuid = uuid.UUID(str(question_id))
        except ValueError:
            return jsonify({'error': 'Invalid question ID format'}), 400
        question = Question.query.get(q_uuid)
        if not question:
            return jsonify({'error': 'Question not found'}), 404

        from .auth import check_subject_access
        if not check_subject_access(question.subject_id):
            return jsonify({'error': 'You do not have access to this subject'}), 403

        return jsonify(question.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<question_id>', methods=['DELETE'])
@jwt_required()
def delete_question(question_id):
    try:
        from ..models import db
        from flask_jwt_extended import get_jwt
        import uuid
        try:
            q_uuid = uuid.UUID(str(question_id))
        except ValueError:
            return jsonify({'error': 'Invalid question ID format'}), 400
        question = Question.query.get(q_uuid)
        if not question:
            return jsonify({'error': 'Question not found'}), 404

        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')

        if user_role not in ['SUPER_ADMIN', 'ADMIN'] and str(question.creator_id) != user_id:
            return jsonify({'error': 'Only the creator of the question or an admin can delete it'}), 403
            
        db.session.delete(question)
        db.session.commit()
        return jsonify({'message': 'Question deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<question_id>', methods=['PUT'])
@jwt_required()
def update_question(question_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        from ..models import db
        from flask_jwt_extended import get_jwt
        import uuid
        try:
            q_uuid = uuid.UUID(str(question_id))
        except ValueError:
            return jsonify({'error': 'Invalid question ID format'}), 400
        question = Question.query.get(q_uuid)
        if not question:
            return jsonify({'error': 'Question not found'}), 404

        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')

        from ..services.rbac_service import has_subject_permission
        is_owner = str(question.creator_id) == user_id
        is_admin = user_role in ['SUPER_ADMIN', 'ADMIN']
        is_expert = has_subject_permission(user_id, question.subject_id, ['SUBJECT_EXPERT'])

        if not is_admin and not is_owner and not is_expert:
            return jsonify({'error': 'Only the creator of the question, an assigned Subject Expert, or an admin can update it'}), 403
            
        from ..services.bloom_service import extract_text_from_editor_data, classify_bloom_level, map_to_difficulty

        # Update fields if provided
        if 'editorData' in data:
            editor_data = data['editorData']
            q_text = extract_text_from_editor_data(editor_data)
            
            computed_bloom_level = classify_bloom_level(q_text)
            computed_difficulty = map_to_difficulty(computed_bloom_level)
            
            question.bloom_level = computed_bloom_level
            question.difficulty = computed_difficulty
            
            # Ensure meta exists
            if 'meta' not in editor_data:
                editor_data['meta'] = {}
            
            editor_data['meta']['bloomLevel'] = computed_bloom_level
            editor_data['meta']['difficulty'] = computed_difficulty
            
            # Re-assign to trigger SQLAlchemy JSON update
            question.editor_data = editor_data
            
        # Optional: Update Subject/CO if needed, though usually fixed. 
        # But admin might want to re-map.
        if 'courseOutcomeId' in data:
            # Handle empty string or null to unassign
            co_id = data['courseOutcomeId']
            if co_id:
                try:
                    co_uuid = uuid.UUID(str(co_id))
                except ValueError:
                    return jsonify({'error': 'Invalid courseOutcomeId format'}), 400
            else:
                co_uuid = None
            question.course_outcome_id = co_uuid

        # Update status and review step tracking
        if 'status' in data:
            new_status = data['status']
            # Allow status update by authorized users
            allowed_statuses = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REVISION_NEEDED']
            if new_status not in allowed_statuses:
                return jsonify({'error': f'Invalid status: {new_status}'}), 400
            
            question.status = new_status
            
            # Log audit trail if status is reviewed
            if new_status in ['APPROVED', 'REVISION_NEEDED']:
                question.reviewed_by = uuid.UUID(user_id)
                if 'reviewComments' in data:
                    question.review_comments = data['reviewComments']
                
                from ..models import QuestionReviewStep
                from datetime import datetime
                review_step = QuestionReviewStep(
                    question_id=question.id,
                    stage_name='SUBJECT_EXPERT',
                    reviewer_id=uuid.UUID(user_id),
                    status=new_status,
                    comments=data.get('reviewComments', ''),
                    reviewed_at=datetime.utcnow()
                )
                db.session.add(review_step)
        elif 'reviewComments' in data:
            question.review_comments = data['reviewComments']
            
        db.session.commit()
        return jsonify({'message': 'Question updated successfully', 'question': question.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

