from datetime import datetime
import uuid
from ..db import db
from ..models import AcademicYear, Semester, Subject, Question

def create_question(data, user_id):
    # Extract data
    editor_data = data.get('editorData')
    co_id = data.get('courseOutcomeId') 
    subject_id = data.get('subjectId')
    
    # Optional fields
    marks = data.get('marks')
    difficulty = data.get('difficulty')

    # Legacy fields (lazy extraction)
    ay_label = None
    sem_number = None
    sub_code = None

    # 0. User & Approval Check
    from ..models import User, FacultySubject, CourseOutcome
    try:
        u_uuid = uuid.UUID(str(user_id))
    except ValueError:
        raise ValueError("Invalid User ID")
        
    user = User.query.get(u_uuid)
    if not user or not user.is_approved:
        raise PermissionError("User not approved")

    subject = None
    
    # Path A: Explicit Subject ID (New Frontend behavior)
    if subject_id:
        try:
            s_uuid = uuid.UUID(subject_id)
            subject = Subject.query.get(s_uuid)
        except ValueError:
             raise ValueError("Invalid Subject ID format")
        
        if not subject:
             raise ValueError("Subject not found")
             
        # Normalize variables for meta storage
        sub_code = subject.code
        sem_number = subject.semester.number
        ay_label = subject.academic_year.label

    # Path B: Legacy/Manual Lookup (Old behavior)
    else:
        # Get or Create Academic Year/Semester logic from before...
        # ... (Preserved for compatibility if needed, but simplified here for brevity since primary path is A)
        
        # Re-extract legacy fields
        ay_label = data.get('academicYear')
        sem_number = int(data.get('semester'))
        sub_code = data.get('subcode')

        academic_year = AcademicYear.query.filter_by(label=ay_label).first()
        if not academic_year:
             # Create logic...
             # For now, let's assume they exist or error out to force Path A usage, 
             # OR we keep the creation logic.
             # Given the user flow, we can just error if not found, or create.
             # Let's keep it simple: We expect Path A mostly.
             pass 
             
        # Actually, let's just use the existing logic block for Path B if Path A failed?
        # To avoid deleting too much code, let's just say:
        
        # 1. Get or Create Academic Year
        academic_year = AcademicYear.query.filter_by(label=ay_label).first()
        if not academic_year:
            try:
                parts = ay_label.split('-')
                start = int(parts[0])
                end = int(parts[1])
            except:
                start = 0
                end = 0
            academic_year = AcademicYear(label=ay_label, start_year=start, end_year=end)
            db.session.add(academic_year)
            db.session.flush()

        # 2. Get or Create Semester
        semester = Semester.query.filter_by(number=sem_number).first()
        if not semester:
            semester = Semester(number=sem_number)
            db.session.add(semester)
            db.session.flush()

        # 3. Find Subject
        subject = Subject.query.filter_by(
            code=sub_code,
            semester_id=semester.id,
            academic_year_id=academic_year.id
        ).first()

        if not subject:
             raise ValueError(f"Subject {sub_code} not found for this Semester/Year")

    # 4. Check Assignment
    assignment = FacultySubject.query.filter_by(faculty_id=user.id, subject_id=subject.id).first()
    if not assignment and user.role != 'ADMIN': # Admin checks? Requirement says Faculty Logic.
        raise PermissionError(f"Subject {sub_code} is not assigned to you")

    # 5. Check Course Outcome
    c_outcome = None
    if co_id:
        try:
            co_uuid = uuid.UUID(co_id)
        except ValueError:
            raise ValueError("Invalid Course Outcome ID format")
            
        c_outcome = CourseOutcome.query.get(co_uuid)
        if not c_outcome:
             raise ValueError("Invalid Course Outcome ID")
        if c_outcome.subject_id != subject.id:
             raise ValueError("Course Outcome does not belong to this subject")

    # 6. Create Question
    # Inject metadata into editor_data so it is stored in the JSON
    if editor_data:
        editor_data['meta'] = {
            'academicYear': ay_label,
            'semester': sem_number,
            'subcode': sub_code,
            'courseOutcomeId': co_id,
            'marks': marks,
            'difficulty': difficulty,
            'savedAt': datetime.utcnow().isoformat()
        }

    question = Question(
        subject_id=subject.id,
        course_outcome_id=co_uuid if co_id else None,
        editor_data=editor_data
    )
    db.session.add(question)
    db.session.commit()
    
    # Return dict using local vars to avoid detached instance issues
    return {
        "id": str(question.id),
        "subcode": sub_code,
        "academicYear": ay_label,
        "semester": sem_number,
        "courseOutcomeId": str(co_uuid) if co_id else None,
        "editorData": editor_data,
        "createdAt": question.created_at.isoformat()
    }

def get_questions(filters):
    query = Question.query.join(Subject).join(AcademicYear).join(Semester)

    if filters.get('subcode'):
        query = query.filter(Subject.code == filters.get('subcode'))
    
    if filters.get('semester'):
        query = query.filter(Semester.number == int(filters.get('semester')))
        
    if filters.get('academicYear'):
        query = query.filter(AcademicYear.label == filters.get('academicYear'))

    return query.all()
