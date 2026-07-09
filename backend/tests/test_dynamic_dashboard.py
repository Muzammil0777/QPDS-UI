import pytest
import json
from datetime import datetime, timedelta
from app import db
from app.models import User, Subject, AcademicYear, Semester, FacultyAssignment, Question, Paper, CourseOutcome
from app.routes.auth import bcrypt
from flask_jwt_extended import create_access_token

def test_academic_dashboard_dynamic_payload(app, client):
    # Setup data
    with app.app_context():
        hashed = bcrypt.hashpw(b'pass', bcrypt.gensalt()).decode('utf-8')
        
        # Create academic user and admin
        u = User(
            name='Academic User',
            email='academic_test@test.com',
            password_hash=hashed,
            role='ACADEMIC',
            is_approved=True
        )
        db.session.add(u)
        db.session.flush()
        u_id = str(u.id)
        
        # Create AY and Sem
        ay = AcademicYear(label="2024-2025", start_year=2024, end_year=2025)
        sem = Semester(number=5)
        db.session.add_all([ay, sem])
        db.session.flush()
        
        # Create Subject
        sub = Subject(code="CS501", name="Software Engineering", semester_id=sem.id, academic_year_id=ay.id)
        db.session.add(sub)
        db.session.flush()
        sub_id = str(sub.id)
        
        # Assign FACULTY role for CS501
        assign1 = FacultyAssignment(
            user_id=u.id,
            subject_id=sub.id,
            role_type='FACULTY',
            valid_from=datetime.utcnow() - timedelta(days=1),
            valid_until=datetime.utcnow() + timedelta(days=30),
            assigned_by=u.id,
            is_active=True
        )
        # Assign SUBJECT_EXPERT role for CS501
        assign2 = FacultyAssignment(
            user_id=u.id,
            subject_id=sub.id,
            role_type='SUBJECT_EXPERT',
            valid_from=datetime.utcnow() - timedelta(days=1),
            valid_until=datetime.utcnow() + timedelta(days=30),
            assigned_by=u.id,
            is_active=True
        )
        db.session.add_all([assign1, assign2])
        db.session.flush()
        
        # Add question in CS501 pending review
        q = Question(
            subject_id=sub.id,
            creator_id=u.id,
            difficulty='EASY',
            bloom_level='remember',
            editor_data={'blocks': []},
            status='PENDING_REVIEW'
        )
        db.session.add(q)
        db.session.commit()

    # Generate token for user
    token = create_access_token(identity=u_id, additional_claims={'role': 'ACADEMIC'})
    headers = {'Authorization': f'Bearer {token}'}

    # Fetch dashboard data
    res = client.get('/api/dashboard/academic', headers=headers)
    assert res.status_code == 200
    
    data = res.get_json()
    assert 'activeRoles' in data
    assert 'FACULTY' in data['activeRoles']
    assert 'SUBJECT_EXPERT' in data['activeRoles']
    
    # Check subjects lists
    assert len(data['facultySubjects']) == 1
    assert data['facultySubjects'][0]['code'] == "CS501"
    
    assert len(data['expertSubjects']) == 1
    assert data['expertSubjects'][0]['code'] == "CS501"
    assert data['expertSubjects'][0]['pendingCount'] == 1
