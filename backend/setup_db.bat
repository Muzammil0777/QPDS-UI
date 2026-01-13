@echo off
setlocal

echo ==========================================
echo QPDS Backend Setup Script
echo ==========================================

cd backend

:: 1. Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    pause
    exit /b 1
)

:: 2. Create Virtual Environment
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
) else (
    echo Virtual environment already exists.
)

:: 3. Activate Virtual Environment
call venv\Scripts\activate

:: 4. Install Dependencies
echo Installing dependencies...
pip install -r requirements.txt

:: 5. Create .env file
if not exist .env (
    echo Creating .env file...
    (
        echo DATABASE_URL=postgresql://postgres:qpds1@localhost:5433/qpds_db
        echo FLASK_APP=run.py
        echo FLASK_DEBUG=1
    ) > .env
    echo .env file created with provided credentials.
) else (
    echo .env file already exists. Skipping creation.
)

:: 6. Initialize Database
if not exist migrations (
    echo Initializing migrations...
    flask db init
    flask db migrate -m "Initial migration"
)

echo Applying migrations...
flask db upgrade

echo ==========================================
echo Setup Complete!
echo To start the server, run:
echo cd backend
echo venv\Scripts\activate
echo flask run
echo ==========================================
pause
