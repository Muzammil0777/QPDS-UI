import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from .config import Config
from .db import db, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── Fix #8: Structured Request Logging ──
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )

    # ── Fix #2: CORS Hardened — restrict to known origins ──
    CORS(app, origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://qpds-ui.vercel.app"
    ])

    # Initialize core extensions
    db.init_app(app)
    migrate.init_app(app, db)

    from flask_jwt_extended import JWTManager
    jwt = JWTManager(app)

    # ── Fix #1: Rate Limiting Middleware ──
    try:
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address

        limiter = Limiter(
            get_remote_address,
            app=app,
            default_limits=["200 per minute"],
            storage_uri="memory://",
        )
    except ImportError:
        limiter = None
        app.logger.warning("Flask-Limiter not installed. Rate limiting disabled.")

    # Register blueprints
    from .routes import questions, subjects, auth, admin, faculty, assignments, settings, dashboard
    app.register_blueprint(questions.bp)
    app.register_blueprint(subjects.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(faculty.bp)
    app.register_blueprint(assignments.bp)
    app.register_blueprint(settings.bp)
    app.register_blueprint(dashboard.bp)

    from .routes import ai
    app.register_blueprint(ai.bp)

    from .routes import papers
    app.register_blueprint(papers.bp)

    from .routes import sections
    app.register_blueprint(sections.bp)

    # ── Apply stricter rate limits to expensive routes ──
    if limiter:
        limiter.limit("5 per minute")(ai.bp)       # AI generation: max 5 calls/min
        limiter.limit("10 per minute")(auth.bp)     # Auth: anti brute-force

    # ── Fix #6: Global JSON Error Handlers ──
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        app.logger.error(f"Internal Server Error: {e}")
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Too many requests. Please slow down."}), 429

    # ── Fix #8: Request logging after each response ──
    @app.after_request
    def log_request(response):
        # Skip health check noise
        if request.path != '/api/health':
            app.logger.info(f"{request.method} {request.path} → {response.status_code}")
        return response

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}

    # Run database integrity check and auto-healing for orphaned questions on startup
    heal_database(app)

    return app


def heal_database(app):
    with app.app_context():
        from .models import Question, Subject, db
        try:
            questions = Question.query.all()
            subjects = Subject.query.all()
            subject_map = {s.id: s for s in subjects}
            
            # Map subjects by (code, semester, academic_year) for lookup
            subject_lookup = {}
            for s in subjects:
                sem_number = s.semester.number if s.semester else None
                ay_label = s.academic_year.label if s.academic_year else None
                if sem_number and ay_label:
                    key = (s.code, sem_number, ay_label)
                    subject_lookup[key] = s
                
            healed_count = 0
            for q in questions:
                if q.subject_id not in subject_map:
                    # Orphaned question found! Match via meta in editor_data
                    meta = q.editor_data.get('meta', {}) if q.editor_data else {}
                    subcode = meta.get('subcode')
                    semester = meta.get('semester')
                    academic_year = meta.get('academicYear')
                    
                    if subcode and semester and academic_year:
                        try:
                            sem_int = int(semester)
                        except (ValueError, TypeError):
                            continue
                        key = (subcode, sem_int, academic_year)
                        if key in subject_lookup:
                            target_subject = subject_lookup[key]
                            q.subject_id = target_subject.id
                            healed_count += 1
                            app.logger.info(f"Auto-healed question {q.id}: mapped to subject {subcode} ({target_subject.id})")
                            
            if healed_count > 0:
                db.session.commit()
                app.logger.info(f"Database integrity check: auto-healed {healed_count} questions.")
            else:
                app.logger.info("Database integrity check: No orphaned questions found.")
        except Exception as e:
            app.logger.error(f"Error during database integrity check: {e}")

