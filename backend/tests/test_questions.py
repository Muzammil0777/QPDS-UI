import json

def test_create_question(app, authenticated_admin_client):
    with app.app_context():
        from app.models import AcademicYear, Semester, Subject, db
        ay = AcademicYear(label='2024-2025', start_year=2024, end_year=2025)
        sem = Semester(number=5)
        db.session.add_all([ay, sem])
        db.session.flush()
        
        sub = Subject(code='CS702', semester_id=sem.id, academic_year_id=ay.id)
        db.session.add(sub)
        db.session.commit()

    payload = {
        "academicYear": "2024-2025",
        "semester": 5,
        "subcode": "CS702",
        "editorData": {
            "time": 1710000000000,
            "blocks": [
                { "type": "paragraph", "data": { "text": "Test Question" } }
            ]
        }
    }
    
    response = authenticated_admin_client.post('/api/questions', json=payload)
    assert response.status_code == 201
    
    data = response.get_json()
    assert data['subcode'] == "CS702"
    assert data['academicYear'] == "2024-2025"
    assert data['semester'] == 5
    assert data['editorData']['blocks'][0]['data']['text'] == "Test Question"

def test_get_questions_filtered(app, authenticated_admin_client):
    # Setup subjects CS702 and CS301
    with app.app_context():
        from app.models import AcademicYear, Semester, Subject, db
        ay = AcademicYear(label='2024-2025', start_year=2024, end_year=2025)
        sem5 = Semester(number=5)
        sem3 = Semester(number=3)
        db.session.add_all([ay, sem5, sem3])
        db.session.flush()
        
        sub1 = Subject(code='CS702', semester_id=sem5.id, academic_year_id=ay.id)
        sub2 = Subject(code='CS301', semester_id=sem3.id, academic_year_id=ay.id)
        db.session.add_all([sub1, sub2])
        db.session.commit()

    # Create two questions
    q1 = {
        "academicYear": "2024-2025",
        "semester": 5,
        "subcode": "CS702",
        "editorData": {
            "time": 1710000000000,
            "blocks": [
                { "type": "paragraph", "data": { "text": "Q1" } }
            ]
        }
    }
    q2 = {
        "academicYear": "2024-2025",
        "semester": 3,
        "subcode": "CS301",
        "editorData": {
            "time": 1710000000000,
            "blocks": [
                { "type": "paragraph", "data": { "text": "Q2" } }
            ]
        }
    }
    
    resp1 = authenticated_admin_client.post('/api/questions', json=q1)
    assert resp1.status_code == 201
    resp2 = authenticated_admin_client.post('/api/questions', json=q2)
    assert resp2.status_code == 201
    
    # Filter by semester 5
    response = authenticated_admin_client.get('/api/questions?semester=5')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['subcode'] == "CS702"

def test_create_question_missing_fields(authenticated_admin_client):
    payload = {
        "academicYear": "2024-2025"
        # Missing other fields
    }
    response = authenticated_admin_client.post('/api/questions', json=payload)
    assert response.status_code == 400
