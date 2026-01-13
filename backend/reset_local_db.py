from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    
    # Also drop alembic_version if it exists (db.drop_all should handle it, but being safe)
    try:
        db.session.execute(text("DROP TABLE IF EXISTS alembic_version"))
        db.session.commit()
    except Exception as e:
        print(f"Error dropping alembic_version: {e}")
        
    print("All tables dropped. Database is empty.")
