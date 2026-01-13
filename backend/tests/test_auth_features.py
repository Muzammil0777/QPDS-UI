import pytest
from app.models import User, Subject, AcademicYear, Semester, FacultySubject, CourseOutcome, db
from flask_jwt_extended import decode_token

def test_auth_flow(client):
    # 1. Register Faculty
    resp = client.post('/auth/register', json={
        'name': 'Fac1',
        'email': 'fac1@test.com',
        'password': 'pass',
        'role': 'FACULTY'
    })
    assert resp.status_code == 201
    
    # 2. Login Unapproved
    resp = client.post('/auth/login', json={
        'email': 'fac1@test.com',
        'password': 'pass'
    })
    assert resp.status_code == 403
    assert 'not approved' in resp.json['error']

    # 3. Create Admin (Seed)
    # We can't register admin via API easily (flag blocked), so create directly DB
    # or register then manual approve
    resp = client.post('/auth/register', json={
        'name': 'Admin',
        'email': 'admin@test.com',
        'password': 'pass',
        'role': 'ADMIN'
    })
    # Manually approve admin for testing
    # Note: app context is needed to direct DB access? 
    # The client fixture wraps requests, but direct DB access needs app context if not implicit.
    # conftest 'app' fixture provides context for db.create_all, but maybe not here?
    # standard pytest-flask exposes 'app' fixture.
    
    # Actually, let's just create Admin user directly in setup or verify registration gave isApproved=True (my code for Admin said True)
    assert resp.json['isApproved'] == True
    
    # Login Admin
    resp = client.post('/auth/login', json={
        'email': 'admin@test.com',
        'password': 'pass'
    })
    assert resp.status_code == 200
    admin_token = resp.json['token']
    
    # 4. Approve Faculty
    # Need faculty ID.
    # Since we can't easily get ID from earlier generic calls unless we query DB,
    # let's query DB.
    # We need to run query inside app context.
    # 'client' doesn't easily expose context. Use 'app' fixture.
    # But usually creating objects in test function works if db session is shared.
    pass

def test_full_workflow(client, app):
    # Setup Data
    # 1. Admin
    with app.app_context():
        # Create Admin
        from app.routes.auth import bcrypt
        hashed = bcrypt.hashpw(b'pass', bcrypt.gensalt()).decode('utf-8')
        admin = User(name='Admin', email='admin@test.com', password_hash=hashed, role='ADMIN', is_approved=True)
        db.session.add(admin)
        
        # Create Faculty
        faculty = User(name='Fac', email='fac@test.com', password_hash=hashed, role='FACULTY', is_approved=False)
        db.session.add(faculty)
        
        # Create Subject Metadata
        ay = AcademicYear(label='2024-2025', start_year=2024, end_year=2025)
        sem = Semester(number=5)
        db.session.add(ay)
        db.session.add(sem)
        db.session.flush()
        
        sub = Subject(code='CS101', semester_id=sem.id, academic_year_id=ay.id)
        db.session.add(sub)
        
        db.session.commit()
        
        # Get IDs
        admin_id = admin.id
        faculty_id = faculty.id
        sub_id = sub.id
        sub_code = sub.code
        
    # Login Admin
    resp = client.post('/auth/login', json={'email': 'admin@test.com', 'password': 'pass'})
    admin_token = resp.json['token']
    headers_adm = {'Authorization': f'Bearer {admin_token}'}
    
    # Approve Faculty
    resp = client.post(f'/admin/approve/{faculty_id}', headers=headers_adm)
    assert resp.status_code == 200
    
    # Create CO
    resp = client.post('/admin/course-outcomes', headers=headers_adm, json={
        'subjectId': str(sub_id),
        'coCode': 'CO1',
        'description': 'Test CO'
    })
    assert resp.status_code == 201
    
    # Assign Subject
    resp = client.post('/admin/assign-subject', headers=headers_adm, json={
        'facultyId': str(faculty_id),
        'subjectId': str(sub_id)
    })
    assert resp.status_code == 201
    
    # Login Faculty
    resp = client.post('/auth/login', json={'email': 'fac@test.com', 'password': 'pass'})
    assert resp.status_code == 200
    fac_token = resp.json['token']
    headers_fac = {'Authorization': f'Bearer {fac_token}'}
    
    # Get CO ID (we need it for questions)
    # We can query or just use the one we created if we returned it? Admin response doesn't return IDs easily.
    # Let's query DB
    with app.app_context():
        co = CourseOutcome.query.filter_by(subject_id=sub_id, co_code='CO1').first()
        co_id = str(co.id)
        
    # Create Question (Success)
    q_data = {
        'academicYear': '2024-2025',
        'semester': 5,
        'subcode': 'CS101',
        'editorData': {'blocks': []},
        'courseOutcomeId': co_id
    }
    resp = client.post('/api/questions', headers=headers_fac, json=q_data)
    assert resp.status_code == 201
    
    # Create Question (Fail - Unassigned Subject)
    # Create another subject
    with app.app_context():
        sub2 = Subject(code='CS102', semester_id=sem.id, academic_year_id=ay.id)
        db.session.add(sub2)
        db.session.commit()
        
    q_data_fail = {
        'academicYear': '2024-2025',
        'semester': 5,
        'subcode': 'CS102',
        'editorData': {},
        'courseOutcomeId': co_id # Wrong CO for subject, but subject check comes first?
    }
    resp = client.post('/api/questions', headers=headers_fac, json=q_data_fail)
    assert resp.status_code == 403 or resp.status_code == 400
    # Logic: "Find Subject" -> returns Subject CS102. 
    # Check Assignment -> Fac not assigned to CS102. -> PermissionError 403.
    assert resp.status_code == 403
    
    # Create Question (Fail - Wrong CO)
    q_data_co_fail = {
        'academicYear': '2024-2025',
        'semester': 5,
        'subcode': 'CS101', # Assigned
        'editorData': {},
        'courseOutcomeId': str(admin_id) # Random UUID, not CO
    }
    resp = client.post('/api/questions', headers=headers_fac, json=q_data_co_fail)
    assert resp.status_code == 400
    assert 'Invalid Course Outcome' in resp.json['error'] or 'belong' in resp.json['error']
