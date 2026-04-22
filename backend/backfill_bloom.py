from app import create_app, db
from app.models import Question
from app.services.bloom_service import extract_text_from_editor_data, classify_bloom_level, map_to_difficulty

def run_backfill():
    app = create_app()
    with app.app_context():
        questions = Question.query.all()
        updated_count = 0
        
        for q in questions:
            # Extract text
            q_text = extract_text_from_editor_data(q.editor_data)
            
            # Recompute
            computed_bloom_level = classify_bloom_level(q_text)
            computed_difficulty = map_to_difficulty(computed_bloom_level)
            
            # Update fields
            q.bloom_level = computed_bloom_level
            q.difficulty = computed_difficulty
            
            # Update meta in editor_data
            editor_data = q.editor_data or {}
            if 'meta' not in editor_data:
                editor_data['meta'] = {}
                
            editor_data['meta']['bloomLevel'] = computed_bloom_level
            editor_data['meta']['difficulty'] = computed_difficulty
            
            # Trigger JSON update
            q.editor_data = editor_data
            
            updated_count += 1
            
        db.session.commit()
        print(f"Backfill complete! Updated {updated_count} questions.")

if __name__ == "__main__":
    run_backfill()
