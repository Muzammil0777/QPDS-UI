import pytest
from app import create_app, db
from app.config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # Use in-memory SQLite for testing
    SQLALCHEMY_ENGINE_OPTIONS = {}

@pytest.fixture
def app():
    app = create_app(TestConfig)
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

@pytest.fixture
def authenticated_admin_client(app, client):
    with app.app_context():
        # Hash a password
        from app.routes.auth import bcrypt
        from app.models import User
        hashed = bcrypt.hashpw(b'pass', bcrypt.gensalt()).decode('utf-8')
        
        # Create an approved admin user
        admin = User(
            name='Admin User',
            email='admin_test@test.com',
            password_hash=hashed,
            role='ADMIN',
            is_approved=True
        )
        db.session.add(admin)
        db.session.commit()
        
        admin_id = str(admin.id)
        from flask_jwt_extended import create_access_token
        token = create_access_token(identity=admin_id, additional_claims={'role': 'ADMIN'})
        
    client.environ_base['HTTP_AUTHORIZATION'] = f'Bearer {token}'
    return client
