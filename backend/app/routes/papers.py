from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models import db, Paper, QuestionUsage

bp = Blueprint('papers', __name__, url_prefix='/api/papers')

@bp.route('/finalize', methods=['POST'])
@jwt_required()
def finalize_paper():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    subject_id = data.get('subjectId')
    title = data.get('title')
    question_ids = data.get('questionIds', [])
    
    if not subject_id or not title:
        return jsonify({'error': 'Missing subjectId or title'}), 400
        
    if not question_ids:
        return jsonify({'error': 'Paper must contain at least one question'}), 400
        
    try:
        # Create Paper
        paper = Paper(
            subject_id=subject_id,
            title=title,
            created_at=datetime.utcnow()
        )
        db.session.add(paper)
        db.session.flush() # Get paper.id
        
        # Track usages
        for q_id in question_ids:
            usage = QuestionUsage(
                question_id=q_id,
                paper_id=paper.id,
                subject_id=subject_id,
                used_at=datetime.utcnow()
            )
            db.session.add(usage)
            
        db.session.commit()
        return jsonify({'message': 'Paper finalized and usages tracked successfully', 'paper': paper.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
