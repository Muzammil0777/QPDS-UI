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
    role = db.Column(db.String(20), nullable=False)  # 'SUPER_ADMIN', 'ADMIN', 'ACADEMIC'
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

class FacultyAssignment(db.Model):
    __tablename__ = 'faculty_assignments'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=False, index=True)
    subject_id = db.Column(db.Uuid, db.ForeignKey('subjects.id'), nullable=True, index=True)
    department = db.Column(db.String(50), nullable=True)
    role_type = db.Column(db.String(20), nullable=False) # 'FACULTY', 'SUBJECT_EXPERT', 'HOD', 'COE', 'STAFF'
    valid_from = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    valid_until = db.Column(db.DateTime, nullable=False)
    delegated_from_user_id = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=True)
    assigned_by = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'subject_id', 'department', 'role_type', name='unique_user_assignment'),
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "userId": str(self.user_id),
            "subjectId": str(self.subject_id) if self.subject_id else None,
            "department": self.department,
            "roleType": self.role_type,
            "validFrom": self.valid_from.isoformat(),
            "validUntil": self.valid_until.isoformat(),
            "delegatedFromUserId": str(self.delegated_from_user_id) if self.delegated_from_user_id else None,
            "assignedBy": str(self.assigned_by),
            "assignedAt": self.assigned_at.isoformat(),
            "isActive": self.is_active
        }

class FacultySubject(db.Model):
    __tablename__ = 'faculty_subjects'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    faculty_id = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=False, index=True)
    subject_id = db.Column(db.Uuid, db.ForeignKey('subjects.id'), nullable=False, index=True)
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
    subject_id = db.Column(db.Uuid, db.ForeignKey('subjects.id'), nullable=False, index=True)
    course_outcome_id = db.Column(db.Uuid, db.ForeignKey('course_outcomes.id'), nullable=True)
    creator_id = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=False, index=True)
    source = db.Column(db.String(10), nullable=False, default="MANUAL")
    difficulty = db.Column(db.String(10), nullable=False, default="MEDIUM")
    bloom_level = db.Column(db.String(20), nullable=False, default="understand")
    editor_data = db.Column(JSON().with_variant(JSONB, 'postgresql'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="DRAFT") # 'DRAFT', 'PENDING_EXPERT', 'PENDING_HOD', 'APPROVED', etc.
    review_comments = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    course_outcome = db.relationship('CourseOutcome', backref='questions')
    creator = db.relationship('User', foreign_keys=[creator_id], backref='questions')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by], backref='reviewed_questions')

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
            "bloomLevel": self.bloom_level,
            "editorData": self.editor_data,
            "status": self.status,
            "reviewComments": self.review_comments,
            "reviewedBy": str(self.reviewed_by) if self.reviewed_by else None,
            "createdAt": self.created_at.isoformat()
        }

class Paper(db.Model):
    __tablename__ = 'papers'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    subject_id = db.Column(db.Uuid, db.ForeignKey('subjects.id'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="DRAFT")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subject = db.relationship('Subject', backref='papers')
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

class AILog(db.Model):
    __tablename__ = 'ai_logs'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    admin_user_id = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=False, index=True)
    question_id = db.Column(db.Uuid, db.ForeignKey('questions.id'), nullable=True, index=True)
    input_prompt = db.Column(db.Text, nullable=False)
    generated_text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    admin = db.relationship('User', foreign_keys=[admin_user_id])
    question = db.relationship('Question', foreign_keys=[question_id])


class SystemSetting(db.Model):
    __tablename__ = 'system_settings'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    key = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(JSON().with_variant(JSONB, 'postgresql'), nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "key": self.key,
            "value": self.value
        }


class QuestionReviewStep(db.Model):
    __tablename__ = 'question_review_steps'

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    question_id = db.Column(db.Uuid, db.ForeignKey('questions.id'), nullable=False)
    stage_name = db.Column(db.String(50), nullable=False) # e.g. 'SUBJECT_EXPERT', 'HOD'
    reviewer_id = db.Column(db.Uuid, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='PENDING') # 'PENDING', 'APPROVED', 'REVISION_NEEDED'
    comments = db.Column(db.Text, nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    question = db.relationship('Question', backref='review_steps')
    reviewer = db.relationship('User', backref='reviews')

    def to_dict(self):
        return {
            "id": str(self.id),
            "questionId": str(self.question_id),
            "stageName": self.stage_name,
            "reviewerId": str(self.reviewer_id) if self.reviewer_id else None,
            "reviewerName": self.reviewer.name if self.reviewer else None,
            "status": self.status,
            "comments": self.comments,
            "reviewedAt": self.reviewed_at.isoformat() if self.reviewed_at else None
        }
