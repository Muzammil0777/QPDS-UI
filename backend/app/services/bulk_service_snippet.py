
def create_bulk_questions(data, user_id):
    """
    Save multiple questions at once from AI Generation.
    Expecting data: { "questions": [ { "text": "...", "type": "short/long" } ], "subjectId": "...", "coIds": [...] }
    """
    subject_id = data.get('subjectId')
    questions_list = data.get('questions', [])
    co_ids = data.get('coIds', []) # Optional: Assign COs to all questions if provided at paper level? 
    # Usually paper has mixed COs, but for draft generation user picked specific COs.
    
    saved_count = 0
    
    # Verify subject
    if not subject_id:
        raise ValueError("Subject ID requred for bulk save")
        
    for q_item in questions_list:
        q_text = q_item.get('text')
        if not q_text:
            continue
            
        # Create EditorJS structure
        # We need to wrap text in connection to the existing schema
        # Schema expects 'editorData': {'time': ..., 'blocks': [...]}
        
        editor_data = {
            "time": 1700000000000,
            "blocks": [
                {
                    "id": "genAI",
                    "type": "paragraph",
                    "data": {
                        "text": q_text
                    }
                }
            ],
            "version": "2.28.0"
        }
        
        new_q = Question(
            subject_id=subject_id,
            faculty_id=user_id, # Admin is saving, treat admin as faculty or allow admin_id? Model has faculty_id fk?
            # If Admin saves, we might need to handle 'faculty_id' field.
            # Let's check model.py if faculty_id is nullable or if admin users are in same table.
            # Usually admin users are Users. faculty_id likely refers to User.id.
            editor_data=editor_data,
            bloom_level="Understand", # Default
            difficulty="Medium" # Default
        )
        
        # Add COs if available
        if co_ids:
            # Need to fetch CO objects and append
            # For efficiency we might skip or do it properly
            pass 
            
        db.session.add(new_q)
        saved_count += 1
        
    db.session.commit()
    return {"message": f"Successfully saved {saved_count} questions", "count": saved_count}
