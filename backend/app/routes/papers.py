from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models import db, Paper, PaperQuestion, QuestionUsage, Question

bp = Blueprint('papers', __name__, url_prefix='/api/papers')

def get_paper_or_404(paper_id):
    paper = Paper.query.get(paper_id)
    return paper

# A. Create Draft
@bp.route('/draft', methods=['POST'])
@jwt_required()
def create_draft():
    data = request.get_json()
    subject_id = data.get('subjectId')
    title = data.get('title')
    initial_question_ids = data.get('initialQuestionIds', [])
    
    if not subject_id or not title:
        return jsonify({'error': 'Missing subjectId or title'}), 400
        
    try:
        paper = Paper(
            subject_id=subject_id,
            title=title,
            status="DRAFT",
            created_at=datetime.utcnow()
        )
        db.session.add(paper)
        db.session.flush()
        
        for idx, q_id in enumerate(initial_question_ids):
            pq = PaperQuestion(
                paper_id=paper.id,
                question_id=q_id,
                order_index=idx
            )
            db.session.add(pq)
            
        db.session.commit()
        return jsonify(paper.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# B. Add Question
@bp.route('/<paper_id>/add-question', methods=['POST'])
@jwt_required()
def add_question(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    if paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400
    
    question_id = request.json.get('questionId')
    
    # Check duplicate
    existing = PaperQuestion.query.filter_by(paper_id=paper_id, question_id=question_id).first()
    if existing: return jsonify({'error': 'Question already exists in paper'}), 400
    
    # Find max order index
    max_idx = db.session.query(db.func.max(PaperQuestion.order_index)).filter_by(paper_id=paper_id).scalar()
    next_idx = (max_idx or 0) + 1
    
    pq = PaperQuestion(paper_id=paper_id, question_id=question_id, order_index=next_idx)
    db.session.add(pq)
    db.session.commit()
    return jsonify({'message': 'Added successfully'}), 200

# C. Remove Question
@bp.route('/<paper_id>/remove-question/<question_id>', methods=['DELETE'])
@jwt_required()
def remove_question(paper_id, question_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    if paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400
    
    pq = PaperQuestion.query.filter_by(paper_id=paper_id, question_id=question_id).first()
    if not pq: return jsonify({'error': 'Question not in paper'}), 404
    
    db.session.delete(pq)
    db.session.commit()
    return jsonify({'message': 'Removed successfully'}), 200

# D. Replace Question
@bp.route('/<paper_id>/replace-question', methods=['PUT'])
@jwt_required()
def replace_question(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    if paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400
    
    old_id = request.json.get('oldQuestionId')
    new_id = request.json.get('newQuestionId')
    
    # Check if new question is duplicate
    new_exists = PaperQuestion.query.filter_by(paper_id=paper_id, question_id=new_id).first()
    if new_exists: return jsonify({'error': 'Replacement question is already in the paper'}), 400
    
    # Get the old record
    old_pq = PaperQuestion.query.filter_by(paper_id=paper_id, question_id=old_id).first()
    if not old_pq: return jsonify({'error': 'Old question not in paper'}), 404
    
    old_pq.question_id = new_id
    db.session.commit()
    return jsonify({'message': 'Replaced successfully'}), 200

# E. Reorder
@bp.route('/<paper_id>/reorder', methods=['PUT'])
@jwt_required()
def reorder_questions(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    if paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400
    
    ordered_ids = request.json.get('orderedQuestionIds', [])
    
    try:
        # Atomic transaction
        for idx, q_id in enumerate(ordered_ids):
            pq = PaperQuestion.query.filter_by(paper_id=paper_id, question_id=q_id).first()
            if pq:
                pq.order_index = idx
        db.session.commit()
        return jsonify({'message': 'Reordered successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# F. Get Paper details
@bp.route('/<paper_id>', methods=['GET'])
@jwt_required()
def get_paper(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    return jsonify(paper.to_dict()), 200

# G. Finalize
@bp.route('/<paper_id>/finalize', methods=['PUT'])
@jwt_required()
def finalize_paper(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    if paper.status == 'FINALIZED': return jsonify({'error': 'Already finalized'}), 400
    
    try:
        paper.status = 'FINALIZED'
        
        # Insert QuestionUsage rows for tracking
        pqs = PaperQuestion.query.filter_by(paper_id=paper_id).all()
        for pq in pqs:
            usage = QuestionUsage(
                question_id=pq.question_id,
                paper_id=paper_id,
                subject_id=paper.subject_id,
                used_at=datetime.utcnow()
            )
            # Make sure avoiding unique constraint failure if usage somehow exists?
            # It shouldn't, but db.session.merge or ignore on conflict is safer. 
            # We enforce via constraint so just add
            db.session.add(usage)
            
        db.session.commit()
        return jsonify(paper.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
