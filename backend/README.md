# QPDS Backend

This is the Flask + PostgreSQL backend for the Question Paper Design System.

## Prerequisites

- Python 3.8+
- PostgreSQL

## Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment:**
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL credentials.
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/qpds_db
     ```

5. **Initialize Database:**
   ```bash
   # Initialize migrations
   flask db init
   
   # Generate migration script
   flask db migrate -m "Initial migration"
   
   # Apply migrations
   flask db upgrade
   ```

## Running the Server

```bash
flask run
```
The server will start at `http://localhost:5000`.

## Running Tests

```bash
pytest
```

## API Endpoints

### POST /api/questions
Create a new question.

**Payload:**
```json
{
  "academicYear": "2024-2025",
  "semester": 5,
  "subcode": "CS702",
  "editorData": { ... }
}
```

### GET /api/questions
Get all questions.

**Query Params:**
- `subcode`
- `semester`
- `academicYear`

### GET /api/subjects
Get all subjects.
