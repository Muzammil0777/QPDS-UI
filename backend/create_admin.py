from app import create_app, db
from app.models import User
import bcrypt

app = create_app()

with app.app_context():
    # Check if admin exists
    admin = User.query.filter_by(email='admin@qpgs.com').first()
    
    if not admin:
        print("Creating admin user...")
        password = 'admin123'
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        admin = User(
            name='System Admin',
            email='admin@qpgs.com',
            password_hash=hashed,
            role='ADMIN',
            designation='Administrator',
            department='ADMIN',
            is_approved=True
        )
        
        db.session.add(admin)
        db.session.commit()
        print("Admin user created successfully!")
        print("Email: admin@qpgs.com")
        print("Password: admin123")
    else:
        print("Admin user already exists.")
        print("Email: admin@qpgs.com")
