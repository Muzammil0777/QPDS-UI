# Question Paper Generation and Distribution System (QPDS)

A comprehensive, AI-powered system designed to streamline the entire lifecycle of question paper management for educational institutions. QPDS enables faculty to collaboratively create, review, and distribute high-quality question papers while providing administrators with robust oversight and validation tools.

---

## 🚀 Live Demo

- **Frontend (Vercel):** [QPDS-UI](https://qpds-ui.vercel.app/) _(Redirects to Login on Get Started)_
- **Backend (Render):** [QPDS-API](https://qpds-ui.onrender.com)
- **Database (Neon):** PostgreSQL (Managed)

---

## 📊 System Workflows & Architecture

### 1. High-Level System Architecture
The application follows a clean client-server architecture. The React frontend interacts with the secure Flask API, which interfaces with a Neon PostgreSQL instance and various external AI/CDN services.

```mermaid
graph TD
    %% Styling Classes
    classDef client fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1;
    classDef server fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20;
    classDef db fill:#FFF3E0,stroke:#E65100,stroke-width:2px,color:#E65100;
    classDef external fill:#F3E5F5,stroke:#6A1B9A,stroke-width:2px,color:#4A148C;

    subgraph Client [Frontend UI Client - React 18 & Material UI]
        C1[Admin / Faculty Dashboards]:::client
        C2[Drag-and-Drop Paper Composer]:::client
        C3[Blueprint Sidebar Analytics]:::client
        C4[Local Auto-Save Engine]:::client
    end

    subgraph Server [RESTful API Server - Flask / Gunicorn]
        S1[JWT Auth & RBAC Manager]:::server
        S2[AI NLP Question Generator]:::server
        S3[Paper Validation Engine]:::server
        S4[Multi-Format Export Service]:::server
    end

    subgraph Storage [Database Storage - PostgreSQL]
        D1[(Neon Serverless DB)]:::db
        D2[(Tables: Users, Subjects, Questions, COs, Papers)]:::db
    end

    subgraph External [External Services]
        E1[Google Gemini AI / HuggingFace]:::external
        E2[MathJax Equation Rendering]:::external
    end

    %% Flow/Connections
    Client <-->|Secure REST API Calls + JWT| Server
    Server <-->|SQLAlchemy ORM Queries| Storage
    Server <-->|API Prompts / Responses| E1
    Client <-->|CDN Scripts & Style Loading| E2
```

### 2. Question Paper Design & Composition Workflow
Faculty and Administrators can build customized exams using the smart composer. The dashboard checks validation limits in real time to ensure course standards are met.

```mermaid
flowchart TD
    %% Styling Classes
    classDef startEnd fill:#ECEFF1,stroke:#37474F,stroke-width:2px,color:#37474F;
    classDef process fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#1B5E20;
    classDef decision fill:#FFF9C4,stroke:#FBC02D,stroke-width:2px,color:#F57F17;
    classDef action fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#0D47A1;

    A([Start: Create Paper]):::startEnd --> B[Select Subject & Enter Target Marks]:::process
    B --> C[Fetch Course Outcomes COs & Blueprint Rules]:::process
    C --> D[Add Questions from Bank or AI Generator]:::action
    D --> E{Real-Time Blueprint Validation}:::decision
    
    E -->|Marks mismatch, difficulty unbalanced, or COs missing| F[Highlight warning in Sidebar Dashboard]:::process
    F --> D
    
    E -->|Validation Passed| G[Approve and Lock Question Paper]:::process
    G --> H[Choose Export Format]:::action
    H --> I1[Download Word .docx]:::action
    H --> I2[Download LaTeX .tex]:::action
    H --> I3[Print / Export PDF]:::action
    I1 & I2 & I3 --> J([End: Ready for Distribution]):::startEnd
```

### 3. Draft Auto-Save Recovery Sequence
To prevent data loss due to session timeouts or navigation errors, question creation forms utilize local backup caching.

```mermaid
sequenceDiagram
    autonumber
    actor User as Faculty Member
    participant UI as Editor UI (React)
    participant Local as localStorage
    participant Server as Flask Backend

    User->>UI: Types question text or changes details
    Note over UI: 3-Second Debounce Timer
    UI->>Local: Write form state & EditorJS blocks (JSON)
    Note right of Local: Saved under key qpds_draft_*

    User->>UI: Closes page / unexpected disconnect
    User->>UI: Reopens Question Editor
    UI->>Local: Check if qpds_draft_* exists
    Local-->>UI: Draft found (JSON)
    UI->>User: Displays Alert recovery banner
    alt User clicks Restore Draft
        UI->>UI: Populate inputs & render EditorJS blocks
    else User clicks Discard
        UI->>Local: Remove draft key
        UI->>UI: Load blank editor
    end
    User->>UI: Click Submit Question
    UI->>Server: POST /api/questions (JWT Auth)
    Server-->>UI: 201 Created
    UI->>Local: Clear draft from storage
```

---

## ✨ Key Features

### 🎓 For Faculty & Item Writers
- **Smart Rich-Text Editor:** Build beautifully formatted questions using **EditorJS** with support for text alignment, tables, images, bulleted lists, and inline formatting.
- **Mathematical Equation Rendering:** Support for complex equations using **LaTeX and MathML** through dynamic **MathJax** compilation.
- **AI-Assisted Question Generation:** Leverage Google Gemini or Hugging Face NLP models to optimize question wording, generate alternative variants, or automatically suggest taxonomy levels.
- **Debounced Local Auto-Save Drafts:** Automatically saves progress to local storage with a 3-second debouncing window. Shows a restoration banner on load if a previous edit session was interrupted.
- **Paginated Question Bank:** Filter and navigate through thousands of questions easily via backend paginated queries (`limit` and `offset` parameters) coupled with a Material-UI pagination controls wrapper.

### 🛡️ For Administrators & Head of Department
- **Interactive Blueprint Dashboard:** A dynamic, sticky analytics panel displayed during paper creation:
  - **Marks Progress Gauge:** Color-coded indicator displaying current accumulated marks vs. targeted blueprint marks.
  - **Difficulty Stacked Ratio Bar:** Segmented bar showcasing percentages of Easy (Green), Medium (Orange), and Hard (Red) questions.
  - **Bloom's Taxonomy Checklist:** Real-time checking of cognitive depth, verifying coverage across Low (Remember/Understand), Mid (Apply/Analyze), and High (Evaluate/Create) taxonomy levels.
  - **Course Outcomes (COs) Coverage Matrix:** Dynamic chip mapping verifying if all subject-specific COs are addressed by selected questions.
- **Faculty & Role Management:** Approve registrations and manage granular user access levels (Admin / Faculty / Student).
- **Course & Syllabus Mapping:** Bind specific Course Outcomes (COs) and syllabus modules directly to academic subjects.
- **BOLA / IDOR Verification Security:** Rigid role-based access checks at backend endpoints. For instance, Faculty can only view/modify questions or blueprints associated with subjects they are registered to instruct.

### 🖨️ Multi-Format Exports
- **Standardized Word (.docx):** Structured outputs including meta-data tables, instructions blocks, section dividers, and bold/italic markup translation using `python-docx`.
- **Pure LaTeX Source (.tex):** Instantly downloads compileable LaTeX files utilizing standard document packages (amsmath, tabularx, geometry, enumitem). Properly escapes text special characters (like `&`, `%`, `_`) while passing math blocks directly to LaTeX math notation (`\[ ... \]`).
- **Print-Ready PDF:** Standardized, print-friendly browser rendering stylesheet matching standard university templates.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 (Vite) | Main client-side single page app framework |
| **Styling** | Material-UI (MUI) v5 + CSS | Sleek theme components & layout control |
| **Rich Editor** | EditorJS + MathJax | Text, table, and LaTeX equation construction |
| **Backend** | Flask (Python 3.11) | RESTful API and core routing framework |
| **Database** | PostgreSQL & SQLite | Managed Neon DB (Production) / Local SQLite (Development) |
| **ORM** | SQLAlchemy | Declarative database relationship management |
| **Auth** | Flask-JWT-Extended | Secure token authentication & payload validation |
| **Deployment** | Vercel & Render | Automated client/server hosting environments |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- PostgreSQL (Local instance or Neon Cloud connection URL)

### 1. Clone the Repository
```bash
git clone https://github.com/Muzammil0777/QPDS-UI.git
cd QPDS-UI
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows (Command Prompt / PowerShell)
.\venv\Scripts\activate

# Linux / Mac OS
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

**Configure Environment Variables:**
Create a file named `.env` in the root of the `backend` directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/qpds_db
SECRET_KEY=your_secure_jwt_secret_key_here
FLASK_ENV=development
GEMINI_API_KEY=your_google_gemini_api_key
HF_API_KEY=your_huggingface_api_token
```

**Initialize Database Migration & Create Admin:**
```bash
# Run database migrations to construct tables
flask db upgrade

# Create the initial seed administrator user
python create_admin.py
```

**Run Backend Development Server:**
```bash
flask run
```
The backend API will start running at `http://127.0.0.1:5000`.

### 3. Frontend Setup
Open a new terminal window in the root directory (`QPDS-UI`):
```bash
# Install frontend package dependencies
npm install

# Run frontend development server
npm start
```
The React development server will start and open your web browser automatically at `http://localhost:3000`.

---

## 🧪 Running Tests
The backend features integration tests for checking system features, BOLA/IDOR security mechanisms, exports, and pagination limits.

To run the backend test suite:
```bash
cd backend
python -m pytest
```

---

## ☁️ Cloud Deployment

### Backend (Render)
- **Environment:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `flask db upgrade && gunicorn run:app`
- **Configured Env Vars:** `DATABASE_URL` (Neon Postgres Connection), `SECRET_KEY`, `GEMINI_API_KEY`, `HF_API_KEY`.

### Frontend (Vercel)
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Configured Env Vars:** `VITE_API_URL` pointing to your deployed Render URL.

---

## 👥 Contributors

Built by the students of M.S. Ramaiah University as part of the Question Paper Design System initiative.

---
*Note: For the admin login credentials in the live demo, please contact the repository owner.*
