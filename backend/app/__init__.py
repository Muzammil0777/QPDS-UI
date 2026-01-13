from flask import Flask
from flask_cors import CORS
from .config import Config
from .db import db, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)
    
    from flask_jwt_extended import JWTManager
    jwt = JWTManager(app)

    # Register blueprints
    from .routes import questions, subjects, auth, admin, faculty
    app.register_blueprint(questions.bp)
    app.register_blueprint(subjects.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(faculty.bp)

    from .routes import ai
    app.register_blueprint(ai.bp)

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}

    return app
