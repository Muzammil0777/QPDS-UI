from app import create_app, db
from sqlalchemy import text
from app.models import User, FacultySubject

app = create_app()

def fix_and_inspect():
    with app.app_context():
        # 1. Fix Column
        print("--- Checking Schema ---")
        try:
            db.session.execute(text("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255)"))
            db.session.commit()
            print("SUCCESS: 'profile_picture' column added.")
        except Exception as e:
            db.session.rollback()
            # If error is "duplicate column", that's fine.
            if "duplicate" in str(e) or "already exists" in str(e):
                print("INFO: 'profile_picture' column already exists.")
            else:
                print(f"ERROR adding column: {e}")

        # 2. Inspect Users
        print("\n--- Inspecting Users ---")
        try:
            users = User.query.all()
            for u in users:
                print(f"User: {u.email}")
                print(f"  > ID: {u.id}")
                print(f"  > Name: '{u.name}'")
                print(f"  > Role: {u.role}")
                
                subjects = FacultySubject.query.filter_by(faculty_id=u.id).all()
                print(f"  > Assigned Subjects: {len(subjects)}")
                for s in subjects:
                    print(f"    - SubID: {s.subject_id}")
                print("-" * 30)
        except Exception as e:
            print(f"ERROR inspecting users: {e}")
            # If inspection fails, it might be due to the column MISSING causing query error
            # But the step 1 should have added it.

if __name__ == "__main__":
    fix_and_inspect()
