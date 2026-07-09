from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models import db, Paper, Section, PaperQuestion, QuestionUsage, Question, Subject

bp = Blueprint('papers', __name__, url_prefix='/api/papers')

def get_paper_or_404(paper_id):
    import uuid
    try:
        p_uuid = uuid.UUID(str(paper_id))
    except ValueError:
        return None
    paper = Paper.query.get(p_uuid)
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

    from .auth import check_subject_access
    if not check_subject_access(subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403
        
    import uuid
    try:
        sub_uuid = uuid.UUID(str(subject_id))
    except ValueError:
        return jsonify({'error': 'Invalid subjectId format'}), 400
        
    try:
        paper = Paper(
            subject_id=sub_uuid,
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
            try:
                q_uuid = uuid.UUID(str(q_id))
            except ValueError:
                continue
            pq = PaperQuestion(
                paper_id=paper.id,
                section_id=section.id,
                question_id=q_uuid,
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

    from .auth import check_subject_access
    if not check_subject_access(paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

    return jsonify(paper.to_dict()), 200

# C. Create Section
@bp.route('/<paper_id>/sections', methods=['POST'])
@jwt_required()
def create_section(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper: return jsonify({'error': 'Paper not found'}), 404

    from .auth import check_subject_access
    if not check_subject_access(paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

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

    from .auth import check_subject_access
    if not check_subject_access(paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

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

    from .auth import check_subject_access
    if not check_subject_access(paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

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

    from .auth import check_subject_access
    if not check_subject_access(paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

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

    from .auth import check_subject_access
    if not check_subject_access(paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403
    
    data = request.get_json() or {}
    total_marks = data.get('totalMarks', 100)
    
    pqs = PaperQuestion.query.filter_by(paper_id=paper_id).all()
    questions = [pq.question for pq in pqs]
    
    from ..services.validation_service import validate_question_paper
    result = validate_question_paper(questions, total_marks)
    return jsonify(result), 200

# H. Validate Draft (Arbitrary Question IDs)
@bp.route('/validate-draft', methods=['POST'])
@jwt_required()
def validate_draft():
    data = request.get_json() or {}
    question_ids = data.get('questionIds', [])
    total_marks = data.get('totalMarks', 100)
    
    import uuid
    parsed_ids = []
    for qid in question_ids:
        try:
            parsed_ids.append(uuid.UUID(str(qid)))
        except ValueError:
            pass
    questions = Question.query.filter(Question.id.in_(parsed_ids)).all()

    from .auth import check_subject_access
    for q in questions:
        if not check_subject_access(q.subject_id):
            return jsonify({'error': 'You do not have access to some questions in the draft'}), 403

    from ..services.validation_service import validate_question_paper
    result = validate_question_paper(questions, total_marks)
    return jsonify(result), 200

# I. Auto Generate Question Paper
@bp.route('/auto-generate', methods=['POST'])
@jwt_required()
def auto_generate_paper():
    data = request.get_json() or {}
    subject_id = data.get('subjectId')
    total_marks = int(data.get('totalMarks', 100))
    target_difficulty = data.get('difficulty', 'MEDIUM').upper()
    
    if not subject_id:
        return jsonify({'error': 'Subject ID required'}), 400

    from .auth import check_subject_access
    if not check_subject_access(subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403
        
    import uuid
    try:
        sub_uuid = uuid.UUID(str(subject_id))
    except ValueError:
        return jsonify({'error': 'Invalid subjectId format'}), 400
        
    questions = Question.query.filter_by(subject_id=sub_uuid, status='APPROVED').all()
    if not questions:
        return jsonify({'error': 'No approved questions found for this subject. Ensure questions are reviewed and approved first.'}), 400
        
    import random
    from ..services.validation_service import validate_question_paper
    
    # Pre-calculate marks for efficiency
    for q in questions:
        ed = q.editor_data or {}
        marks_str = ed.get('marks') or ed.get('meta', {}).get('marks')
        try:
            q._mark_val = float(marks_str) if marks_str else 0
        except:
            q._mark_val = 0

    valid_subset = None
    max_attempts = 2000
    
    for _ in range(max_attempts):
        subset = []
        current_marks = 0
        
        # Bias the shuffle slightly towards target_difficulty
        if random.random() > 0.5:
             questions.sort(key=lambda q: 0 if (q.difficulty or 'MEDIUM').upper() == target_difficulty else 1)
        else:
             random.shuffle(questions)
             
        for q in questions:
            if current_marks + q._mark_val <= total_marks:
                subset.append(q)
                current_marks += q._mark_val
                if current_marks == total_marks:
                    break
                    
        if current_marks == total_marks:
            val_res = validate_question_paper(subset, total_marks)
            if val_res['valid']:
                valid_subset = subset
                break
                
    if not valid_subset:
        return jsonify({'error': 'Could not find a combination of questions satisfying the 40/30/30 distribution and Bloom coverage rules. Add more varied questions to the bank.'}), 400
        
    try:
        subject = Subject.query.get(sub_uuid)
        paper = Paper(
            subject_id=sub_uuid,
            title=f"Auto-Generated Paper ({total_marks} Marks)",
            status="DRAFT",
            created_at=datetime.utcnow()
        )
        db.session.add(paper)
        db.session.flush()

        section = Section(
            paper_id=paper.id,
            title="Section A",
            order_index=0
        )
        db.session.add(section)
        db.session.flush()
        
        for idx, q in enumerate(valid_subset):
            pq = PaperQuestion(
                paper_id=paper.id,
                section_id=section.id,
                question_id=q.id,
                order_index=idx
            )
            db.session.add(pq)
            
        db.session.commit()
        return jsonify({'paperId': str(paper.id)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<paper_id>/export/docx', methods=['GET'])
@jwt_required()
def export_paper_docx(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper:
        return jsonify({'error': 'Paper not found'}), 404

    from .auth import check_subject_access
    if not check_subject_access(paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

    try:
        from ..services.export_service import generate_docx
        from flask import send_file
        
        file_stream = generate_docx(paper)
        
        filename = f"Exam_Paper_{paper.title.replace(' ', '_')}.docx"
        return send_file(
            file_stream,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<paper_id>/export/latex', methods=['GET'])
@jwt_required()
def export_paper_latex(paper_id):
    paper = get_paper_or_404(paper_id)
    if not paper:
        return jsonify({'error': 'Paper not found'}), 404

    from .auth import check_subject_access
    if not check_subject_access(paper.subject_id):
        return jsonify({'error': 'You do not have access to this subject'}), 403

    try:
        from ..services.export_service import generate_latex
        from flask import send_file
        
        file_stream = generate_latex(paper)
        
        filename = f"Exam_Paper_{paper.title.replace(' ', '_')}.tex"
        return send_file(
            file_stream,
            mimetype="application/x-latex",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
