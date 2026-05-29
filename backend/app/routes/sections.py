from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..models import db, Section, PaperQuestion, Question

bp = Blueprint('sections', __name__, url_prefix='/api/sections')

def get_section_or_404(section_id):
    import uuid
    try:
        s_uuid = uuid.UUID(str(section_id))
    except ValueError:
        return None
    return Section.query.get(s_uuid)

@bp.route('/<section_id>/add-question', methods=['POST'])
@jwt_required()
def add_question(section_id):
    section = get_section_or_404(section_id)
    if not section: return jsonify({'error': 'Section not found'}), 404

    from .auth import check_subject_access
    if not check_subject_access(section.paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

    if section.paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400
    
    question_id = request.json.get('questionId')
    
    # Check paper-wide duplicate
    existing = PaperQuestion.query.filter_by(paper_id=section.paper_id, question_id=question_id).first()
    if existing: return jsonify({'error': 'Question already exists in paper'}), 400
    
    max_idx = db.session.query(db.func.max(PaperQuestion.order_index)).filter_by(section_id=section_id).scalar()
    next_idx = (max_idx or 0) + 1
    
    pq = PaperQuestion(paper_id=section.paper_id, section_id=section_id, question_id=question_id, order_index=next_idx)
    db.session.add(pq)
    db.session.commit()
    return jsonify({'message': 'Added successfully'}), 200

@bp.route('/<section_id>/remove-question/<question_id>', methods=['DELETE'])
@jwt_required()
def remove_question(section_id, question_id):
    section = get_section_or_404(section_id)
    if not section: return jsonify({'error': 'Section not found'}), 404

    from .auth import check_subject_access
    if not check_subject_access(section.paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

    if section.paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400
    
    pq = PaperQuestion.query.filter_by(section_id=section_id, question_id=question_id).first()
    if not pq: return jsonify({'error': 'Question not in section'}), 404
    
    db.session.delete(pq)
    db.session.commit()
    return jsonify({'message': 'Removed successfully'}), 200

@bp.route('/<section_id>/replace-question', methods=['PUT'])
@jwt_required()
def replace_question(section_id):
    section = get_section_or_404(section_id)
    if not section: return jsonify({'error': 'Section not found'}), 404

    from .auth import check_subject_access
    if not check_subject_access(section.paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

    if section.paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400
    
    old_id = request.json.get('oldQuestionId')
    new_id = request.json.get('newQuestionId')
    
    # Check duplicate anywhere in paper
    new_exists = PaperQuestion.query.filter_by(paper_id=section.paper_id, question_id=new_id).first()
    if new_exists: return jsonify({'error': 'Replacement question is already in the paper'}), 400
    
    old_pq = PaperQuestion.query.filter_by(section_id=section_id, question_id=old_id).first()
    if not old_pq: return jsonify({'error': 'Old question not in section'}), 404
    
    old_pq.question_id = new_id
    db.session.commit()
    return jsonify({'message': 'Replaced successfully'}), 200

@bp.route('/<section_id>/reorder-questions', methods=['PUT'])
@jwt_required()
def reorder_questions(section_id):
    section = get_section_or_404(section_id)
    if not section: return jsonify({'error': 'Section not found'}), 404

    from .auth import check_subject_access
    if not check_subject_access(section.paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

    if section.paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400
    
    ordered_ids = request.json.get('orderedQuestionIds', [])
    try:
        for idx, q_id in enumerate(ordered_ids):
            pq = PaperQuestion.query.filter_by(section_id=section_id, question_id=q_id).first()
            if pq: pq.order_index = idx
        db.session.commit()
        return jsonify({'message': 'Reordered successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<section_id>', methods=['DELETE'])
@jwt_required()
def delete_section(section_id):
    section = get_section_or_404(section_id)
    if not section: return jsonify({'error': 'Section not found'}), 404

    from .auth import check_subject_access
    if not check_subject_access(section.paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

    if section.paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400
    
    # Must be empty
    count = PaperQuestion.query.filter_by(section_id=section_id).count()
    if count > 0:
        return jsonify({'error': 'Cannot delete section with questions inside. Remove questions first.'}), 400
        
    db.session.delete(section)
    db.session.commit()
    return jsonify({'message': 'Section deleted'}), 200
