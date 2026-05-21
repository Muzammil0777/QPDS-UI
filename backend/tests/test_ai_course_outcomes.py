import pytest
import json
import uuid
from unittest.mock import MagicMock, patch
from flask_jwt_extended import create_access_token
from app import db
from app.models import User, Subject, AcademicYear, Semester, CourseOutcome, Question



def test_generate_paper_and_bulk_save_with_co_mapping(app, authenticated_admin_client):
    # Setup database with metadata, subjects and course outcomes
    with app.app_context():
        ay = AcademicYear(label='2024-2025', start_year=2024, end_year=2025)
        sem = Semester(number=5)
        db.session.add_all([ay, sem])
        db.session.flush()

        subject = Subject(code='CS502', name='Computer Networks', semester_id=sem.id, academic_year_id=ay.id)
        db.session.add(subject)
        db.session.flush()

        co1 = CourseOutcome(subject_id=subject.id, co_code='CO1', description='Describe protocols')
        co2 = CourseOutcome(subject_id=subject.id, co_code='CO2', description='Explain principles')
        db.session.add_all([co1, co2])
        db.session.commit()

        subject_id = str(subject.id)
        co1_id = str(co1.id)
        co2_id = str(co2.id)

    # 1. Mock the InferenceClient chat_completion response
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps({
        "sectionA": [
            {"text": "What is TCP?", "marks": 5, "coCode": "CO1"},
            {"text": "Explain IPv6.", "marks": 5, "coCode": "CO2"}
        ],
        "sectionB": [
            {"text": "Design a client-server socket program.", "marks": 12, "coCode": "CO1"}
        ],
        "totalQuestions": 3
    })
    
    mock_output = MagicMock()
    mock_output.choices = [mock_choice]

    with patch('app.routes.ai.InferenceClient') as mock_client_class:
        mock_client = MagicMock()
        mock_client.chat_completion.return_value = mock_output
        mock_client_class.return_value = mock_client

        # Call generate-paper
        payload = {
            "subjectId": subject_id,
            "courseOutcomeIds": [co1_id, co2_id],
            "difficulty": "medium",
            "courseSpecifications": "Some syllabus info",
            "marksDistribution": {"short": 2, "long": 1}
        }
        
        response = authenticated_admin_client.post('/admin/ai/generate-paper', json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert len(data['sectionA']) == 2
        assert len(data['sectionB']) == 1
        
        # Verify coCode to courseOutcomeId mapping
        assert data['sectionA'][0]['coCode'] == "CO1"
        assert data['sectionA'][0]['courseOutcomeId'] == co1_id
        
        assert data['sectionA'][1]['coCode'] == "CO2"
        assert data['sectionA'][1]['courseOutcomeId'] == co2_id

        assert data['sectionB'][0]['coCode'] == "CO1"
        assert data['sectionB'][0]['courseOutcomeId'] == co1_id

    # 2. Test Saving Bulk Questions with specific CO IDs
    questions_to_save = [
        {"text": "What is TCP?", "marks": 5, "type": "short", "courseOutcomeId": co1_id},
        {"text": "Explain IPv6.", "marks": 5, "type": "short", "courseOutcomeId": co2_id},
        {"text": "Design a client-server socket program.", "marks": 12, "type": "long", "courseOutcomeId": co1_id}
    ]
    
    bulk_payload = {
        "subjectId": subject_id,
        "coIds": [co1_id, co2_id],
        "questions": questions_to_save
    }
    
    save_response = authenticated_admin_client.post('/api/questions/bulk', json=bulk_payload)
    if save_response.status_code != 201:
        print("BULK SAVE FAILED:", save_response.get_json())
    assert save_response.status_code == 201
    
    # 3. Query the Database to verify each question got saved with the correct course outcome
    with app.app_context():
        questions_in_db = Question.query.filter_by(subject_id=uuid.UUID(subject_id)).all()
        assert len(questions_in_db) == 3
        
        q_tcp = next(q for q in questions_in_db if "TCP" in q.editor_data['blocks'][0]['data']['text'])
        assert str(q_tcp.course_outcome_id) == co1_id
        
        q_ipv6 = next(q for q in questions_in_db if "IPv6" in q.editor_data['blocks'][0]['data']['text'])
        assert str(q_ipv6.course_outcome_id) == co2_id
        
        q_socket = next(q for q in questions_in_db if "socket" in q.editor_data['blocks'][0]['data']['text'])
        assert str(q_socket.course_outcome_id) == co1_id
