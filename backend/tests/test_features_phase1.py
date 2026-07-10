from app.models import User, Subject, AcademicYear, Semester, FacultyAssignment, Question, Paper, db
from app.routes.auth import bcrypt
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta

def test_features_phase1(client, app):
    # Setup Data
    with app.app_context():
        # Hash password
        hashed = bcrypt.hashpw(b'pass', bcrypt.gensalt()).decode('utf-8')

        # 1. User
        fac_a = User(name='Faculty A', email='fac_a@msruas.ac.in', password_hash=hashed, role='FACULTY', is_approved=True)
        db.session.add(fac_a)
        db.session.flush()

        # 2. Metadata
        ay = AcademicYear(label='2024-2025', start_year=2024, end_year=2025)
        sem = Semester(number=5)
        db.session.add_all([ay, sem])
        db.session.flush()

        # 3. Subject
        sub = Subject(code='CS101', name='Computer Networks', semester_id=sem.id, academic_year_id=ay.id)
        db.session.add(sub)
        db.session.flush()

        # 4. Assignment
        assign = FacultyAssignment(
            user_id=fac_a.id,
            subject_id=sub.id,
            role_type='FACULTY',
            valid_until=datetime.utcnow() + timedelta(days=365),
            assigned_by=fac_a.id
        )
        db.session.add(assign)
        db.session.flush()

        # 5. Add 5 Questions to verify pagination
        for i in range(5):
            q = Question(
                subject_id=sub.id,
                creator_id=fac_a.id,
                difficulty='EASY',
                bloom_level='remember',
                editor_data={'blocks': [{'type': 'paragraph', 'data': {'text': f'Question {i}'}}], 'marks': '5'}
            )
            db.session.add(q)
        db.session.flush()

        # 6. Create Paper
        paper = Paper(subject_id=sub.id, title='Final Exam Paper', status='DRAFT')
        db.session.add(paper)
        db.session.flush()

        fac_a_id = str(fac_a.id)
        sub_id = str(sub.id)
        paper_id = str(paper.id)
        db.session.commit()

    token = create_access_token(identity=fac_a_id, additional_claims={'role': 'FACULTY'})
    headers = {'Authorization': f'Bearer {token}'}

    # ==================== TEST PAGINATION ====================
    # 1. Standard listing without page/limit (should return flat array of size 5)
    resp = client.get(f'/api/questions?subjectId={sub_id}', headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json, list)
    assert len(resp.json) == 5

    # 2. Paginated listing: page=1, limit=2 (should return paginated structure with questions list of size 2)
    resp = client.get(f'/api/questions?subjectId={sub_id}&page=1&limit=2', headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json, dict)
    assert 'questions' in resp.json
    assert len(resp.json['questions']) == 2
    assert resp.json['total'] == 5
    assert resp.json['page'] == 1
    assert resp.json['pages'] == 3

    # ==================== TEST MS WORD EXPORT ====================
    # 3. Trigger word export
    resp = client.get(f'/api/papers/{paper_id}/export/docx', headers=headers)
    assert resp.status_code == 200
    assert resp.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    assert resp.headers.get("Content-Disposition").startswith("attachment; filename=Exam_Paper_")
    
    # 4. Check that unauthorized user cannot export
    token_unauth = create_access_token(identity=str(fac_a_id), additional_claims={'role': 'STUDENT'})
    headers_unauth = {'Authorization': f'Bearer {token_unauth}'}
    resp = client.get(f'/api/papers/{paper_id}/export/docx', headers=headers_unauth)
    # STUDENT is not in roles / subject is not assigned to this role
    # Wait, check_subject_access checks role == ADMIN or FacultySubject.
    # Since STUDENT doesn't have FacultySubject assignment, it will return 403.
    assert resp.status_code == 403
