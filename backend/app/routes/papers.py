from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models import db, Paper, Section, PaperQuestion, QuestionUsage, Question

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

        # Create Default Section
        section = Section(
            paper_id=paper.id,
            title="Section A",
            order_index=0
        )
        db.session.add(section)
        db.session.flush()
        
        # Inject Initial Questions into Default Section
        for idx, q_id in enumerate(initial_question_ids):
            pq = PaperQuestion(
                paper_id=paper.id,
                section_id=section.id,
                question_id=q_id,
                order_index=idx
            )
            db.session.add(pq)
            
        db.session.commit()
        return jsonify(paper.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# B. Get Paper details (Structured hierarchically by to_dict)
@bp.route('/<paper_id>', methods=['GET'])
@jwt_required()
def get_paper(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    return jsonify(paper.to_dict()), 200

# C. Create Section
@bp.route('/<paper_id>/sections', methods=['POST'])
@jwt_required()
def create_section(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    if paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400

    data = request.get_json()
    title = data.get('title', 'New Section')
    total_marks = data.get('totalMarks', None)

    try:
        max_idx = db.session.query(db.func.max(Section.order_index)).filter_by(paper_id=paper_id).scalar()
        next_idx = (max_idx or 0) + 1

        section = Section(paper_id=paper_id, title=title, total_marks=total_marks, order_index=next_idx)
        db.session.add(section)
        db.session.commit()
        return jsonify(section.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# D. Reorder Sections
@bp.route('/<paper_id>/reorder-sections', methods=['PUT'])
@jwt_required()
def reorder_sections(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    if paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400
    
    ordered_ids = request.json.get('orderedSectionIds', [])
    try:
        for idx, s_id in enumerate(ordered_ids):
            sec = Section.query.filter_by(paper_id=paper_id, id=s_id).first()
            if sec: sec.order_index = idx
        db.session.commit()
        return jsonify({'message': 'Sections reordered'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# E. Move Question Across Sections
@bp.route('/<paper_id>/move-question', methods=['PUT'])
@jwt_required()
def move_question(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    if paper.status == 'FINALIZED': return jsonify({'error': 'Paper is finalized'}), 400

    data = request.get_json()
    q_id = data.get('questionId')
    from_sec_id = data.get('fromSectionId')
    to_sec_id = data.get('toSectionId')
    new_index = data.get('newIndex', 0)

    try:
        # Find the question in old section
        pq = PaperQuestion.query.filter_by(paper_id=paper_id, section_id=from_sec_id, question_id=q_id).first()
        if not pq: return jsonify({'error': 'Question not found in source section'}), 404

        # Validate destination section exists inside this paper
        dest_sec = Section.query.filter_by(id=to_sec_id, paper_id=paper_id).first()
        if not dest_sec: return jsonify({'error': 'Destination section invalid'}), 400

        # Change section assignment
        pq.section_id = to_sec_id
        pq.order_index = new_index

        # Normalize the order indices of the destination section
        # Shift everything >= new_index up by 1 (except the one we just moved)
        dest_pqs = PaperQuestion.query.filter(
            PaperQuestion.section_id == to_sec_id,
            PaperQuestion.question_id != q_id,
            PaperQuestion.order_index >= new_index
        ).all()

        for dest_pq in dest_pqs:
            dest_pq.order_index += 1

        db.session.commit()
        return jsonify({'message': 'Question moved cleanly'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# F. Finalize
@bp.route('/<paper_id>/finalize', methods=['PUT'])
@jwt_required()
def finalize_paper(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    if paper.status == 'FINALIZED': return jsonify({'error': 'Already finalized'}), 400
    
    try:
        # Validate that no sections are empty
        sections = Section.query.filter_by(paper_id=paper_id).all()
        if not sections:
            return jsonify({'error': 'Paper must have at least one section'}), 400
            
        for sec in sections:
            count = PaperQuestion.query.filter_by(section_id=sec.id).count()
            if count == 0:
                return jsonify({'error': f'Section "{sec.title}" is empty. Cannot finalize paper.'}), 400

        # Paper Validation Engine
        data = request.get_json() or {}
        total_marks = data.get('totalMarks')
        if not total_marks:
            return jsonify({'error': 'totalMarks is required to finalize paper.'}), 400
            
        pqs = PaperQuestion.query.filter_by(paper_id=paper_id).all()
        questions = [pq.question for pq in pqs]
        
        from ..services.validation_service import validate_question_paper
        validation = validate_question_paper(questions, total_marks)
        if not validation['valid']:
            return jsonify({'error': 'Paper validation failed', 'validationErrors': validation['errors']}), 400

        paper.status = 'FINALIZED'
        
        # Tracking usages natively
        pqs = PaperQuestion.query.filter_by(paper_id=paper_id).all()
        for pq in pqs:
            usage = QuestionUsage(
                question_id=pq.question_id,
                paper_id=paper_id,
                subject_id=paper.subject_id,
                used_at=datetime.utcnow()
            )
            db.session.add(usage)
            
        db.session.commit()
        return jsonify(paper.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# G. Validate Paper
@bp.route('/<paper_id>/validate', methods=['POST'])
@jwt_required()
def validate_paper(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404
    
    data = request.get_json() or {}
    total_marks = data.get('totalMarks', 100)
    
    pqs = PaperQuestion.query.filter_by(paper_id=paper_id).all()
    questions = [pq.question for pq in pqs]
    
    from ..services.validation_service import validate_question_paper
    result = validate_question_paper(questions, total_marks)
    return jsonify(result), 200
