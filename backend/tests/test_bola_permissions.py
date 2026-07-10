from app.models import User, Subject, AcademicYear, Semester, FacultyAssignment, Question, Paper, Section, db
from app.routes.auth import bcrypt
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta

def test_bola_permissions(client, app):
    # Setup data
    with app.app_context():
        # Hash password
        hashed = bcrypt.hashpw(b'pass', bcrypt.gensalt()).decode('utf-8')

        # 1. Users
        fac_a = User(name='Faculty A', email='fac_a@msruas.ac.in', password_hash=hashed, role='FACULTY', is_approved=True)
        fac_b = User(name='Faculty B', email='fac_b@msruas.ac.in', password_hash=hashed, role='FACULTY', is_approved=True)
        admin = User(name='Admin', email='admin_user@msruas.ac.in', password_hash=hashed, role='ADMIN', is_approved=True)
        db.session.add_all([fac_a, fac_b, admin])
        db.session.flush()

        # 2. Metadata (AY and Sem)
        ay = AcademicYear(label='2024-2025', start_year=2024, end_year=2025)
        sem = Semester(number=5)
        db.session.add_all([ay, sem])
        db.session.flush()

        # 3. Subjects
        sub_a = Subject(code='CS101', name='Subject A', semester_id=sem.id, academic_year_id=ay.id)
        sub_b = Subject(code='CS102', name='Subject B', semester_id=sem.id, academic_year_id=ay.id)
        db.session.add_all([sub_a, sub_b])
        db.session.flush()

        # 4. Assignments (Fac A -> Sub A, Fac B -> Sub B)
        assign_a = FacultyAssignment(
            user_id=fac_a.id,
            subject_id=sub_a.id,
            role_type='FACULTY',
            valid_until=datetime.utcnow() + timedelta(days=365),
            assigned_by=admin.id
        )
        assign_b = FacultyAssignment(
            user_id=fac_b.id,
            subject_id=sub_b.id,
            role_type='FACULTY',
            valid_until=datetime.utcnow() + timedelta(days=365),
            assigned_by=admin.id
        )
        db.session.add_all([assign_a, assign_b])
        db.session.flush()

        # 5. Questions
        q_a = Question(
            subject_id=sub_a.id,
            creator_id=fac_a.id,
            difficulty='EASY',
            bloom_level='remember',
            editor_data={'blocks': [{'type': 'paragraph', 'data': {'text': 'Question A'}}]}
        )
        q_b = Question(
            subject_id=sub_b.id,
            creator_id=fac_b.id,
            difficulty='MEDIUM',
            bloom_level='understand',
            editor_data={'blocks': [{'type': 'paragraph', 'data': {'text': 'Question B'}}]}
        )
        # Question in Sub A created by B (Fac A is assigned, but not creator)
        q_a2 = Question(
            subject_id=sub_a.id,
            creator_id=fac_b.id,
            difficulty='HARD',
            bloom_level='create',
            editor_data={'blocks': [{'type': 'paragraph', 'data': {'text': 'Question A2'}}]}
        )
        db.session.add_all([q_a, q_b, q_a2])
        db.session.flush()

        # 6. Papers
        paper_b = Paper(subject_id=sub_b.id, title='Paper B', status='DRAFT')
        db.session.add(paper_b)
        db.session.flush()

        sec_b = Section(paper_id=paper_b.id, title='Section A', order_index=0)
        db.session.add(sec_b)
        db.session.flush()

        # Store IDs for tests
        fac_a_id = str(fac_a.id)
        fac_b_id = str(fac_b.id)
        admin_id = str(admin.id)
        sub_a_id = str(sub_a.id)
        sub_b_id = str(sub_b.id)
        q_a_id = str(q_a.id)
        q_b_id = str(q_b.id)
        q_a2_id = str(q_a2.id)
        paper_b_id = str(paper_b.id)
        sec_b_id = str(sec_b.id)
        db.session.commit()

    # Define tokens
    token_a = create_access_token(identity=fac_a_id, additional_claims={'role': 'FACULTY'})
    token_b = create_access_token(identity=fac_b_id, additional_claims={'role': 'FACULTY'})
    token_admin = create_access_token(identity=admin_id, additional_claims={'role': 'ADMIN'})

    headers_a = {'Authorization': f'Bearer {token_a}'}
    headers_b = {'Authorization': f'Bearer {token_b}'}
    headers_admin = {'Authorization': f'Bearer {token_admin}'}

    # ==================== TESTS FOR FACULTY A ====================

    # 1. Querying all questions without subject ID should only return questions from Subject A
    resp = client.get('/api/questions', headers=headers_a)
    assert resp.status_code == 200
    q_ids = [q['id'] for q in resp.json]
    assert q_a_id in q_ids
    assert q_a2_id in q_ids
    assert q_b_id not in q_ids

    # 2. Querying Subject B questions specifically should return 403
    resp = client.get(f'/api/questions?subjectId={sub_b_id}', headers=headers_a)
    assert resp.status_code == 403

    # 3. GET single question from Subject B should return 403
    resp = client.get(f'/api/questions/{q_b_id}', headers=headers_a)
    assert resp.status_code == 403

    # 4. UPDATE question in Subject B should return 403
    resp = client.put(f'/api/questions/{q_b_id}', headers=headers_a, json={'editorData': {'blocks': []}})
    assert resp.status_code == 403

    # 5. DELETE question in Subject B should return 403
    resp = client.delete(f'/api/questions/{q_b_id}', headers=headers_a)
    assert resp.status_code == 403

    # 6. Faculty A belongs to Subject A, but did not create q_a2.
    # Faculty A trying to UPDATE q_a2 should return 403 (owner check).
    resp = client.put(f'/api/questions/{q_a2_id}', headers=headers_a, json={'editorData': {'blocks': []}})
    assert resp.status_code == 403

    # 7. Faculty A trying to DELETE q_a2 should return 403 (owner check).
    resp = client.delete(f'/api/questions/{q_a2_id}', headers=headers_a)
    assert resp.status_code == 403

    # 8. Faculty A trying to access Paper B should return 403.
    resp = client.get(f'/api/papers/{paper_b_id}', headers=headers_a)
    assert resp.status_code == 403

    # 9. Faculty A trying to edit Paper B sections should return 403.
    resp = client.post(f'/api/papers/{paper_b_id}/sections', headers=headers_a, json={'title': 'Fail'})
    assert resp.status_code == 403

    # 10. Faculty A trying to edit sections via Sections Blueprint should return 403.
    resp = client.post(f'/api/sections/{sec_b_id}/add-question', headers=headers_a, json={'questionId': q_a_id})
    assert resp.status_code == 403

    # ==================== TESTS FOR ADMIN ====================

    # Admin should be able to view Subject B's question
    resp = client.get(f'/api/questions/{q_b_id}', headers=headers_admin)
    assert resp.status_code == 200

    # Admin should be able to update q_a2 (not created by Admin)
    resp = client.put(f'/api/questions/{q_a2_id}', headers=headers_admin, json={'editorData': {'blocks': []}})
    assert resp.status_code == 200

    # Admin should be able to view Paper B
    resp = client.get(f'/api/papers/{paper_b_id}', headers=headers_admin)
    assert resp.status_code == 200
