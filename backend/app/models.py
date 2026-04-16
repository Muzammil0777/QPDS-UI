import uuid
from datetime import datetime
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB
from .db import db

# Use generic Uuid from SQLAlchemy logic (Flask-SQLAlchemy 3.x+)
# Or use db.Uuid which maps correctly.
# However, to avoid issues, we can just use db.Uuid if available.
# Let's assume db.Uuid works. If not, we fall back.
# Actually, safest is to try-except or just use String for SQLite tests?
# No, let's use the dialect specific variant pattern if possible, or just db.Uuid.
# db.Uuid is available in recent versions.

class AcademicYear(db.Model):
    __tablename__ = 'academic_years'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    label = db.Column(db.String(20), unique=True, nullable=False)  # e.g., "2024-2025"
    start_year = db.Column(db.Integer, nullable=False)
    end_year = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subjects = db.relationship('Subject', backref='academic_year', lazy=True)

class Semester(db.Model):
    __tablename__ = 'semesters'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    number = db.Column(db.Integer, unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subjects = db.relationship('Subject', backref='semester', lazy=True)

class Subject(db.Model):
    __tablename__ = 'subjects'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    code = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=True)
    semester_id = db.Column(db.Uuid, db.ForeignKey('semesters.id'), nullable=False)
    academic_year_id = db.Column(db.Uuid, db.ForeignKey('academic_years.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    questions = db.relationship('Question', backref='subject', lazy=True)

    __table_args__ = (
        db.UniqueConstraint('code', 'semester_id', 'academic_year_id', name='unique_subject_sem_ay'),
    )


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'ADMIN', 'FACULTY'
    designation = db.Column(db.String(50)) # 'HOD','Professor','Associate Professor','Assistant Professor'
    department = db.Column(db.String(50)) # 'CSE'
    is_approved = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "designation": self.designation,
            "department": self.department,
            "isApproved": self.is_approved,
            "isActive": self.is_active,
            "profilePicture": self.profile_picture
        }

class FacultySubject(db.Model):
    __tablename__ = 'faculty_subjects'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    faculty_id = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=False)
    subject_id = db.Column(db.Uuid, db.ForeignKey('subjects.id'), nullable=False)
    assigned_by = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('faculty_id', 'subject_id', name='unique_faculty_subject'),
    )

class CourseOutcome(db.Model):
    __tablename__ = 'course_outcomes'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    subject_id = db.Column(db.Uuid, db.ForeignKey('subjects.id'), nullable=False)
    co_code = db.Column(db.String(10), nullable=False) # CO1, CO2
    description = db.Column(db.Text, nullable=False)
    
    subject = db.relationship('Subject', backref=db.backref('course_outcomes', lazy=True))

    __table_args__ = (
        db.UniqueConstraint('subject_id', 'co_code', name='unique_subject_co'),
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "coCode": self.co_code,
            "description": self.description,
            "subjectId": str(self.subject_id)
        }

class Question(db.Model):
    __tablename__ = 'questions'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    subject_id = db.Column(db.Uuid, db.ForeignKey('subjects.id'), nullable=False)
    course_outcome_id = db.Column(db.Uuid, db.ForeignKey('course_outcomes.id'), nullable=True)
    creator_id = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=False)
    source = db.Column(db.String(10), nullable=False, default="MANUAL")
    difficulty = db.Column(db.String(10), nullable=False, default="MEDIUM")
    editor_data = db.Column(JSON().with_variant(JSONB, 'postgresql'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    course_outcome = db.relationship('CourseOutcome', backref='questions')
    creator = db.relationship('User', backref='questions')

    def to_dict(self):
        return {
            "id": str(self.id),
            "subcode": self.subject.code,
            "academicYear": self.subject.academic_year.label,
            "semester": self.subject.semester.number,
            "courseOutcomeId": str(self.course_outcome_id) if self.course_outcome_id else None,
            "coCode": self.course_outcome.co_code if self.course_outcome else None,
            "creatorId": str(self.creator_id) if self.creator_id else None,
            "creatorName": self.creator.name if self.creator else None,
            "source": self.source,
            "difficulty": self.difficulty,
            "editorData": self.editor_data,
            "createdAt": self.created_at.isoformat()
        }

class Paper(db.Model):
    __tablename__ = 'papers'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    subject_id = db.Column(db.Uuid, db.ForeignKey('subjects.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="DRAFT")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sections = db.relationship('Section', backref='paper', cascade='all, delete-orphan', order_by='Section.order_index', lazy=True)
    usages = db.relationship('QuestionUsage', backref='paper', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "subjectId": str(self.subject_id),
            "title": self.title,
            "status": self.status,
            "sections": [s.to_dict() for s in self.sections],
            "createdAt": self.created_at.isoformat()
        }

class Section(db.Model):
    __tablename__ = 'sections'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    paper_id = db.Column(db.Uuid, db.ForeignKey('papers.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    total_marks = db.Column(db.Integer, nullable=True)
    order_index = db.Column(db.Integer, nullable=False, default=0)

    paper_questions = db.relationship('PaperQuestion', backref='section', cascade='all, delete-orphan', order_by='PaperQuestion.order_index', lazy=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "paperId": str(self.paper_id),
            "title": self.title,
            "totalMarks": self.total_marks,
            "orderIndex": self.order_index,
            # Attach question properties alongside mapping properties if needed,
            # but usually directly dumping the question works
            "questions": [
                {
                    **pq.question.to_dict(),
                    "paperQuestionId": str(pq.id),
                    "orderIndex": pq.order_index
                } for pq in self.paper_questions
            ]
        }

class PaperQuestion(db.Model):
    __tablename__ = 'paper_questions'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    paper_id = db.Column(db.Uuid, db.ForeignKey('papers.id'), nullable=False)
    section_id = db.Column(db.Uuid, db.ForeignKey('sections.id'), nullable=False)
    question_id = db.Column(db.Uuid, db.ForeignKey('questions.id'), nullable=False)
    order_index = db.Column(db.Integer, nullable=False, default=0)

    question = db.relationship('Question')

    __table_args__ = (
        db.UniqueConstraint('paper_id', 'question_id', name='unique_paper_question'),
    )

class QuestionUsage(db.Model):
    __tablename__ = 'question_usages'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    question_id = db.Column(db.Uuid, db.ForeignKey('questions.id'), nullable=False, index=True)
    paper_id = db.Column(db.Uuid, db.ForeignKey('papers.id'), nullable=False)
    subject_id = db.Column(db.Uuid, db.ForeignKey('subjects.id'), nullable=False, index=True)
    used_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        db.UniqueConstraint('question_id', 'paper_id', name='unique_question_paper_usage'),
    )
