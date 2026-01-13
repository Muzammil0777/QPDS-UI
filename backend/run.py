from app import create_app, db
from app.models import AcademicYear, Semester, Subject, Question

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db, 
        'AcademicYear': AcademicYear, 
        'Semester': Semester, 
        'Subject': Subject, 
        'Question': Question
    }

if __name__ == '__main__':
    app.run(debug=True)
