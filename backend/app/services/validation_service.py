import math

def validate_question_paper(questions, total_marks):
    """
    Validates a question paper based on the following constraints:
    - Easy >= 40%
    - Medium >= 30%
    - Hard >= 30%
    (uses floor calculation to allow flexibility for non-perfect question counts)
    - Bloom's Taxonomy coverage (Low, Medium, High required)
    - Total Marks exactly matching
    - Unique question IDs
    """
    errors = []
    total_q = len(questions)
    
    if total_q == 0:
        return {
            "valid": False, 
            "errors": ["Paper has no questions"],
            "details": {}
        }
        
    easy_count = 0
    medium_count = 0
    hard_count = 0
    
    has_low_bloom = False
    has_medium_bloom = False
    has_high_bloom = False
    
    current_total_marks = 0
    seen_ids = set()
    
    for q in questions:
        # Check duplicate
        if q.id in seen_ids:
            errors.append(f"Duplicate question ID found: {q.id}")
        seen_ids.add(q.id)
        
        # Check difficulty
        diff = q.difficulty.upper() if q.difficulty else "MEDIUM"
        if diff == "EASY": easy_count += 1
        elif diff == "MEDIUM": medium_count += 1
        elif diff == "HARD": hard_count += 1
        
        # Check Bloom
        bloom = q.bloom_level.lower() if q.bloom_level else "understand"
        if bloom in ["remember", "understand"]: has_low_bloom = True
        if bloom in ["apply", "analyze"]: has_medium_bloom = True
        if bloom in ["evaluate", "create"]: has_high_bloom = True
        
        # Check Marks
        ed = q.editor_data or {}
        marks_str = ed.get('marks')
        if not marks_str:
            meta = ed.get('meta', {})
            marks_str = meta.get('marks')
            
        try:
            m = float(marks_str) if marks_str else 0
            current_total_marks += m
        except ValueError:
            pass

    # Threshold checks using math.floor
    min_easy = math.floor(total_q * 0.40)
    min_medium = math.floor(total_q * 0.30)
    min_hard = math.floor(total_q * 0.30)
    
    if easy_count < min_easy:
        errors.append(f"Easy questions insufficient: need {min_easy}, got {easy_count}")
    if medium_count < min_medium:
        errors.append(f"Medium questions insufficient: need {min_medium}, got {medium_count}")
    if hard_count < min_hard:
        errors.append(f"Hard questions insufficient: need {min_hard}, got {hard_count}")
        
    if not has_low_bloom:
        errors.append("Missing low-level Bloom questions (remember/understand)")
    if not has_medium_bloom:
        errors.append("Missing medium-level Bloom questions (apply/analyze)")
    if not has_high_bloom:
        errors.append("Missing high-level Bloom questions (evaluate/create)")
        
    try:
        req_marks = float(total_marks)
    except (ValueError, TypeError):
        req_marks = 0
        errors.append("Invalid required total marks format")
        
    if current_total_marks != req_marks:
        errors.append(f"Total marks mismatch: Required {req_marks}, Actual {current_total_marks}")
        
    # Gather details for UI
    details = {
        "easy_count": easy_count,
        "medium_count": medium_count,
        "hard_count": hard_count,
        "min_easy": min_easy,
        "min_medium": min_medium,
        "min_hard": min_hard,
        "has_low_bloom": has_low_bloom,
        "has_medium_bloom": has_medium_bloom,
        "has_high_bloom": has_high_bloom,
        "current_total_marks": current_total_marks,
        "required_total_marks": req_marks,
        "total_q": total_q
    }
        
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "details": details
    }
