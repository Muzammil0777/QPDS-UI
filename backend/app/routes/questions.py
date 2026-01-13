
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

        for q_item in questions:
            q_text = q_item.get('text')
            if not q_text: 
                continue
                
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
                "version": "2.28.0"
            }
            
            new_q = Question(
                subject_id=subject_id,
                course_outcome_id=assigned_co_id, # Optional
                editor_data=editor_data,
                created_at=datetime.utcnow()
                # model doesn't seem to have faculty_id column in the output I saw?
                # Checked models.py: Question has subject_id, co_id, editor_data. Doesn't show faculty_id?
                # Wait, I saw models.py output lines 116-138.
                # It does NOT verify faculty_id. It might trigger error if I try to set it and column doesn't exist.
                # I will NOT set faculty_id based on viewing models.py just now.
            )
            from ..models import db
            db.session.add(new_q)
            saved_count += 1
            
        db.session.commit()
        return jsonify({"message": f"Saved {saved_count} questions", "count": saved_count}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('', methods=['GET'])
@jwt_required()
def get_questions():
    # Allow filtering by subject_id
    subject_id = request.args.get('subjectId')
    
    if subject_id:
        questions = Question.query.filter_by(subject_id=subject_id).order_by(Question.created_at.desc()).all()
    else:
        questions = Question.query.order_by(Question.created_at.desc()).all()
        
    return jsonify([q.to_dict() for q in questions]), 200

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
            
        # Update fields if provided
        if 'editorData' in data:
            question.editor_data = data['editorData']
            
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

