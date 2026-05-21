import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5433/qpds_db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-this-in-prod")

    # Fix #3: JWT tokens expire after 6 hours (prevents permanent token theft)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=6)

    # Fix #7: Database connection pooling for stability under load
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 10,          # Max persistent connections
        "max_overflow": 20,       # Extra connections under burst load
        "pool_timeout": 30,       # Wait 30s before raising QueuePool error
        "pool_recycle": 1800,     # Recycle connections every 30 min (Neon drops idle ones)
        "pool_pre_ping": True,    # Test connections before use (essential for Neon serverless)
    }

