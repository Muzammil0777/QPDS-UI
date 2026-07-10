from app.models import User, Subject, AcademicYear, Semester, FacultyAssignment, Question, Paper, Section, PaperQuestion, CourseOutcome, db
from app.routes.auth import bcrypt
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta

def test_features_phase2(client, app):
    """Tests LaTeX export endpoint and permission enforcement."""
    with app.app_context():
        hashed = bcrypt.hashpw(b'pass', bcrypt.gensalt()).decode('utf-8')

        # Users
        fac = User(name='Faculty X', email='fac_x@msruas.ac.in', password_hash=hashed, role='FACULTY', is_approved=True)
        db.session.add(fac)
        db.session.flush()

        # Metadata
        ay = AcademicYear(label='2024-2025', start_year=2024, end_year=2025)
        sem = Semester(number=5)
        db.session.add_all([ay, sem])
        db.session.flush()

        # Subject + CO
        sub = Subject(code='MA201', name='Engineering Mathematics', semester_id=sem.id, academic_year_id=ay.id)
        db.session.add(sub)
        db.session.flush()

        co = CourseOutcome(subject_id=sub.id, co_code='CO1', description='Solve differential equations')
        db.session.add(co)
        db.session.flush()

        # Assignment
        assign = FacultyAssignment(
            user_id=fac.id,
            subject_id=sub.id,
            role_type='FACULTY',
            valid_until=datetime.utcnow() + timedelta(days=365),
            assigned_by=fac.id
        )
        db.session.add(assign)
        db.session.flush()

        # Questions
        q1 = Question(
            subject_id=sub.id, creator_id=fac.id, difficulty='EASY',
            bloom_level='remember', course_outcome_id=co.id,
            editor_data={'blocks': [{'type': 'paragraph', 'data': {'text': 'Define Laplace Transform.'}}], 'marks': '10'}
        )
        q2 = Question(
            subject_id=sub.id, creator_id=fac.id, difficulty='HARD',
            bloom_level='evaluate', course_outcome_id=co.id,
            editor_data={
                'blocks': [
                    {'type': 'paragraph', 'data': {'text': 'Solve the following integral:'}},
                    {'type': 'math', 'data': {'latex': r'\int_0^\infty e^{-st} f(t) dt', 'display': True}}
                ],
                'marks': '15'
            }
        )
        db.session.add_all([q1, q2])
        db.session.flush()

        # Paper with sections and questions
        paper = Paper(subject_id=sub.id, title='Math Final Exam', status='DRAFT')
        db.session.add(paper)
        db.session.flush()

        sec = Section(paper_id=paper.id, title='Section A', order_index=0)
        db.session.add(sec)
        db.session.flush()

        pq1 = PaperQuestion(paper_id=paper.id, section_id=sec.id, question_id=q1.id, order_index=0)
        pq2 = PaperQuestion(paper_id=paper.id, section_id=sec.id, question_id=q2.id, order_index=1)
        db.session.add_all([pq1, pq2])
        db.session.flush()

        fac_id = str(fac.id)
        paper_id = str(paper.id)
        db.session.commit()

    token = create_access_token(identity=fac_id, additional_claims={'role': 'FACULTY'})
    headers = {'Authorization': f'Bearer {token}'}

    # ==================== TEST LATEX EXPORT ====================

    # 1. Successful LaTeX export
    resp = client.get(f'/api/papers/{paper_id}/export/latex', headers=headers)
    assert resp.status_code == 200
    assert resp.mimetype == 'application/x-latex'
    assert resp.headers.get('Content-Disposition').startswith('attachment; filename=Exam_Paper_')

    # 2. Verify LaTeX content structure
    tex_content = resp.data.decode('utf-8')
    assert r'\documentclass' in tex_content
    assert r'\begin{document}' in tex_content
    assert r'\end{document}' in tex_content
    assert 'Engineering Mathematics' in tex_content
    assert 'MA201' in tex_content
    assert 'SECTION A' in tex_content
    # Math block should be passed through as-is
    assert r'\int_0^\infty' in tex_content

    # 3. Unauthorized role (STUDENT) should get 403
    token_student = create_access_token(identity=fac_id, additional_claims={'role': 'STUDENT'})
    headers_student = {'Authorization': f'Bearer {token_student}'}
    resp = client.get(f'/api/papers/{paper_id}/export/latex', headers=headers_student)
    assert resp.status_code == 403

    # 4. Non-existent paper should get 404
    resp = client.get('/api/papers/00000000-0000-0000-0000-000000000000/export/latex', headers=headers)
    assert resp.status_code == 404

    # ==================== TEST DOCX EXPORT (regression) ====================

    # 5. Verify docx export still works with populated paper
    resp = client.get(f'/api/papers/{paper_id}/export/docx', headers=headers)
    assert resp.status_code == 200
    assert resp.mimetype == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
