import json

def test_create_question(client):
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
    
    response = client.post('/api/questions', json=payload)
    assert response.status_code == 201
    
    data = response.get_json()
    assert data['subcode'] == "CS702"
    assert data['academicYear'] == "2024-2025"
    assert data['semester'] == 5
    assert data['editorData']['blocks'][0]['data']['text'] == "Test Question"

def test_get_questions_filtered(client):
    # Create two questions
    q1 = {
        "academicYear": "2024-2025",
        "semester": 5,
        "subcode": "CS702",
        "editorData": {}
    }
    q2 = {
        "academicYear": "2024-2025",
        "semester": 3,
        "subcode": "CS301",
        "editorData": {}
    }
    
    client.post('/api/questions', json=q1)
    client.post('/api/questions', json=q2)
    
    # Filter by semester 5
    response = client.get('/api/questions?semester=5')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['subcode'] == "CS702"

def test_create_question_missing_fields(client):
    payload = {
        "academicYear": "2024-2025"
        # Missing other fields
    }
    response = client.post('/api/questions', json=payload)
    assert response.status_code == 400
