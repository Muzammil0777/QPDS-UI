from app import create_app, db
from app.models import User, SystemSetting
import bcrypt

app = create_app()

with app.app_context():
    # Auto-create missing tables in the target database (essential for Neon DB deployments)
    db.create_all()
    
    # 1. Seed System Settings
    settings_to_seed = {
        "allowed_email_domains": ["msruas.ac.in", "ruas.ac.in", "qpgs.com"],
        "departments": ["CSE", "ECE", "ME", "CE", "ADMIN"],
        "active_ai_provider": "HUGGING_FACE",
        "ai_endpoint_url": "https://api-inference.huggingface.co/models/",
        "approval_workflow": ["SUBJECT_EXPERT"],
        "branding": {
            "name": "QPDS University Portal",
            "primary_color": "#1976d2",
            "secondary_color": "#9c27b0"
        }
    }

    for key, value in settings_to_seed.items():
        existing = SystemSetting.query.filter_by(key=key).first()
        if not existing:
            setting = SystemSetting(key=key, value=value)
            db.session.add(setting)
            print(f"Seeded setting: {key} -> {value}")
        else:
            print(f"Setting already exists: {key}")

    db.session.commit()

    # 2. Seed Super Admin
    super_admin = User.query.filter_by(email='superadmin@qpgs.com').first()
    if not super_admin:
        print("Creating super admin user...")
        password = 'superadmin123'
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        super_admin = User(
            name='System Super Admin',
            email='superadmin@qpgs.com',
            password_hash=hashed,
            role='SUPER_ADMIN',
            designation='Super Administrator',
            department='ADMIN',
            is_approved=True
        )
        db.session.add(super_admin)
        print("Super admin user created successfully! (superadmin@qpgs.com / superadmin123)")
    else:
        print("Super admin user already exists.")

    # 3. Seed Admin
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
        print("Admin user created successfully! (admin@qpgs.com / admin123)")
    else:
        admin.role = 'ADMIN'
        print("Admin user exists. Validated role.")

    db.session.commit()
    print("Database seeding completed.")
