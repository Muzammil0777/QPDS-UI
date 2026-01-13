from app import create_app, db
from app.models import User, FacultySubject, Subject

app = create_app()

def inspect():
    with app.app_context():
        users = User.query.all()
        print(f"Found {len(users)} users.")
        for u in users:
            print(f"User: {u.id} | Name: '{u.name}' | Email: {u.email} | Role: {u.role}")
            subjects = FacultySubject.query.filter_by(faculty_id=u.id).all()
            print(f"  > Assigned Subjects: {len(subjects)}")
            for s in subjects:
                print(f"    - SubID: {s.subject_id}")

if __name__ == "__main__":
    inspect()
