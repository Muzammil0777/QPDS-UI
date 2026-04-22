
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
        user = User.query.get(user_id)
        if not user or user.role != 'ADMIN':
            return jsonify({'error': 'Unauthorized: Only admins can bulk save AI questions'}), 403

        # Optional metadata
        difficulty = data.get('difficulty', 'MEDIUM').upper()
        if difficulty not in ["EASY", "MEDIUM", "HARD"]:
            difficulty = "MEDIUM"

        # Simple bulk creation logic
        saved_count = 0
        
        # Heuristic for CO assignment:
        # If COs provided, assign the first one? Or leave null?
        # User selected multiple COs for paper. We can assign the first one or leave it blank (mapped to subject only).
        # Better: leave it nullable if unsure, or assign the first valid one.
        # Let's check if valid.
        assigned_co_id = None
        if co_ids and len(co_ids) > 0:
            assigned_co_id = co_ids[0] # Just assign first for now to link it somewhere
            
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
            
            new_q = Question(
                subject_id=subject_id,
                course_outcome_id=assigned_co_id, # Optional
                creator_id=user_id,
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
    subject_id = request.args.get('subjectId')
    difficulty = request.args.get('difficulty')
    source = request.args.get('source')
    creator_id = request.args.get('creatorId')
    include_used = request.args.get('includeUsed', 'false').lower() == 'true'
    
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

    query = Question.query
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    if source:
        query = query.filter_by(source=source)
    if creator_id:
        query = query.filter_by(creator_id=creator_id)
        
    if not include_used and recently_used_ids_obj:
        query = query.filter(Question.id.not_in(list(recently_used_ids_obj)))
        
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
        question = Question.query.get(question_id)
        if not question:
            return jsonify({'error': 'Question not found'}), 404
        return jsonify(question.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<question_id>', methods=['DELETE'])
@jwt_required()
def delete_question(question_id):
    try:
        from ..models import db
        question = Question.query.get(question_id)
        if not question:
            return jsonify({'error': 'Question not found'}), 404
            
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
        question = Question.query.get(question_id)
        if not question:
            return jsonify({'error': 'Question not found'}), 404
            
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
            question.course_outcome_id = co_id if co_id else None
            
        db.session.commit()
        return jsonify({'message': 'Question updated successfully', 'question': question.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

