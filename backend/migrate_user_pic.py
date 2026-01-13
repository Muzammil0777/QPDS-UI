from app import create_app, db
from sqlalchemy import text

app = create_app()

def add_column():
    with app.app_context():
        with db.engine.connect() as conn:
            # Check if column exists to avoid error
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255)"))
                print("Column 'profile_picture' added successfully.")
            except Exception as e:
                print(f"Migration result (probably already exists): {e}")

if __name__ == "__main__":
    add_column()
