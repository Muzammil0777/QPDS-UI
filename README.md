# Asteriq Papers: The AI-Powered Exam Lifecycle Operating System

Asteriq Papers (formerly QPDS) is an enterprise-grade academic lifecycle operating system designed to automate, secure, and validate the entire exam generation process. Built on an on-premise first philosophy, Asteriq Papers enables academic institutions to manage syllabus alignment, dynamically compile question papers, conduct peer reviews, and securely export final exam packets, all while ensuring absolute data sovereignty and regulatory compliance.

---

## 🚀 Live Demo & Hosting

- **Frontend Interface (Vercel):** [Asteriq Papers Web App](https://qpds-ui.vercel.app/) *(Redirects to Login on Get Started)*
- **Backend API Server (Render):** [Asteriq Papers API Service](https://qpds-ui.onrender.com)
- **Database Engine (Neon):** PostgreSQL (Managed Serverless instance)

---

## 📊 System Architecture & Core Workflows

Rather than using complex graphical diagrams, the sections below outline the system component structures, data flow processes, and workflow sequences that run Asteriq Papers.

### 1. Three-Tier Component Architecture
The platform is organized into three distinct structural layers designed for data security and low latency:

*   **Client Interface Layer (React 18 & Material UI):**
    A responsive Single Page Application (SPA) that runs entirely in the user's browser. It manages client-side routing, equation layouts via MathJax rendering, local storage drafts caching, and the interactive blueprint validation dashboard.
*   **Application Services Layer (Flask & SQLAlchemy):**
    A stateless RESTful API server that processes requests, validates session tokens, checks permissions, runs NLP Bloom's taxonomy classifications, and compiles document outputs. Under production workloads, this layer can scale horizontally behind a reverse proxy (Nginx).
*   **Database & Storage Layer (PostgreSQL & Redis):**
    The persistence engine. PostgreSQL stores relational tables (academic calendars, user roles, course outcomes, question banks, and audit logs). An in-memory Redis cache handles active session metadata and rate-limiting counters.

### 2. Detailed Data Flow Model
When a faculty member interacts with the application, data flows through the following secure path:
1.  **Request Initiation:** The user performs an action (e.g., editing a math question). The React frontend captures the change, debounces it to limit server load, and fires an HTTPS request with a cryptographically signed JWT token stored in the headers.
2.  **API Gateway Routing:** The request lands at the API Gateway, which checks rate-limiting limits. If valid, the gateway proxies the request to the Flask server.
3.  **Auth & Permission Resolution:** The Flask auth middleware decrypts the JWT token, verifies its expiration, and resolves the user's roles. The RBAC utility checks if the user possesses an active assignment (Faculty, Subject Expert, HOD, or COE) for the targeted subject.
4.  **Business Logic Execution:** If authorized, the route executes the requested operation. For question creation, it sends raw text to the local NLP classification service to estimate its Bloom's Taxonomy category before formatting the data payload.
5.  **Database Commit & Response:** The SQLAlchemy ORM commits the transactions to PostgreSQL. The server returns a structured JSON payload to the client interface, which updates the UI.

### 3. Blueprint-Driven Exam Composition Workflow
Composing an examination paper follows a strict validation sequence to guarantee compliance with institutional and accreditation standards (such as NBA and NAAC outcome mappings):
1.  **Blueprint Setup:** The Controller of Examinations (COE) creates a paper blueprint, defining the subject, total marks (e.g., 100 marks), and targeted difficulty distribution (e.g., 30% Easy, 50% Medium, 20% Hard).
2.  **Item Compilation:** The exam composer gathers questions from the approved Question Bank or triggers AI suggestions.
3.  **Real-Time Validation:** As questions are added, a side-panel widget runs calculations on the current draft:
    *   *Marks Accumulator:* Verifies if current marks match the targeted total marks.
    *   *Difficulty Balancing:* Evaluates the current difficulty percentages against the target ratios.
    *   *Outcome Verification:* Evaluates the Course Outcomes (CO) mapping matrix to confirm that all required learning outcomes are assessed by at least one question.
4.  **Workflow Lock:** If any criteria are missed, warnings are flagged. Once all validation rules pass, the COE locks the paper draft, which transitions its status to `APPROVED_BY_DEPT` and prepares it for export.

### 4. Debounced Draft Recovery Loop
To protect user progress during network drops or browser crashes, the composer implements an offline draft recovery system:
1.  **Keystroke Capture:** As a user writes a question in the editor, the interface captures keystrokes.
2.  **Local Caching:** A 3-second debouncing window waits for the user to pause writing. Once paused, the current editor state is written as a JSON block to the browser's `localStorage` under a unique draft key (`asteriq_draft_[id]`).
3.  **State Check on Reload:** If the user gets disconnected or closes the tab, the database transaction is interrupted. On reload, the editor checks if a local draft key exists.
4.  **Prompt Recovery:** If a local draft is detected, a restoration banner prompts the user. If approved, the local JSON state is loaded back into the EditorJS fields, rendering all LaTeX formulas. Once the user manually clicks "Save to DB" and the server commits the record, the local storage key is deleted.

---

## ✨ Key Product Features

### 🎓 For Faculty & Question Writers
- **Structured Rich-Text Composer:** Build questions using **EditorJS** with support for text alignment, tables, images, and bulleted lists.
- **Dynamic Equation Compiler:** Renders complex mathematical formulas, equations, and chemical symbols instantly using inline LaTeX notation (e.g., `\( E=mc^2 \)`) and block display syntax via MathJax.
- **AI-Assisted Item Writer:** Leverages local LLM prompting to suggest question variations, generate alternative phrasing, and auto-evaluate cognitive levels.
- **Outcome Matrix Mapping:** Bind questions directly to Course Outcomes (COs) and Program Outcomes (POs) to simplify compliance reporting.

### 🛡️ For HODs, COEs, & Admins
- **Validation Sidebar Widget:** A real-time analytics panel that tracks marks accumulation, difficulty splits, and CO coverage during paper creation.
- **Review & Approval Gateways:** Enforces peer-review workflows where questions must pass Expert and HOD reviews before entering the active bank.
- **Contextual Access Controls (RBAC):** Restricts data access strictly to assigned subjects, preventing faculty from viewing or modifying unauthorized resources.
- **Sovereign Audit Trails:** Logs administrative actions (approvals, locks, exports) with cryptographic signatures to ensure non-repudiation.

### 🖨️ Multi-Format Document Compilation
- **Standardized Word (.docx):** Compiles exam layouts into Word documents containing institutional header tables, instructions, and section dividers.
- **Compileable LaTeX Source (.tex):** Generates clean LaTeX documents with properly escaped special characters and formatted equations.
- **Secure PDF Export:** Produces print-ready PDFs matching standard university examination templates.

---

## 🛠️ Technology Stack

*   **Frontend SPA:** React 18 (Vite build tool)
*   **Component Styling:** Material-UI (MUI) v5 + CSS
*   **Rich Text Editor:** EditorJS + MathJax v3 rendering
*   **Core Backend:** Flask (Python 3.11)
*   **ORM Integration:** SQLAlchemy + Flask-Migrate
*   **Session Security:** Flask-JWT-Extended (Token-based auth)
*   **Database Engine:** PostgreSQL (Neon Serverless in production)
*   **API Protocols:** REST (stateless CRUD) and GraphQL (dashboard reporting)

---

## 📂 Codebase Directory Layout

### Frontend Source Structure (`src/`)
- [src/App.jsx](file:///C:/Users/muzam/Desktop/qpgs-ui/src/App.jsx): Main router defining layout access rules for HOD, COE, Admin, and Faculty roles.
- [src/theme.js](file:///C:/Users/muzam/Desktop/qpgs-ui/src/theme.js): Material-UI global configuration defining layout palettes and typography.
- [src/components/](file:///C:/Users/muzam/Desktop/qpgs-ui/src/components):
  - [EditorJSEditor.jsx](file:///C:/Users/muzam/Desktop/qpgs-ui/src/components/EditorJSEditor.jsx): Integrated EditorJS layout with math block extensions.
  - [Navbar.jsx](file:///C:/Users/muzam/Desktop/qpgs-ui/src/components/Navbar.jsx) & [Sidebar.jsx](file:///C:/Users/muzam/Desktop/qpgs-ui/src/components/Sidebar.jsx): Navigation layouts.
  - [ProtectedRoute.jsx](file:///C:/Users/muzam/Desktop/qpgs-ui/src/components/ProtectedRoute.jsx): Guard component verifying token authorizations before rendering views.
- [src/services/api.js](file:///C:/Users/muzam/Desktop/qpgs-ui/src/services/api.js): Axios interceptor configuring token authorization headers, rate limiters, and retry logic.
- [src/pages/](file:///C:/Users/muzam/Desktop/qpgs-ui/src/pages):
  - [Home.jsx](file:///C:/Users/muzam/Desktop/qpgs-ui/src/pages/Home.jsx): Landing page.
  - **admin/**: Admin dashboards including [ComposePaper.jsx](file:///C:/Users/muzam/Desktop/qpgs-ui/src/pages/admin/ComposePaper.jsx) and [AssignmentManager.jsx](file:///C:/Users/muzam/Desktop/qpgs-ui/src/pages/admin/AssignmentManager.jsx).
  - **faculty/**: Faculty dashboards including [CreateQuestion.jsx](file:///C:/Users/muzam/Desktop/qpgs-ui/src/pages/faculty/CreateQuestion.jsx) and [ReviewQuestion.jsx](file:///C:/Users/muzam/Desktop/qpgs-ui/src/pages/faculty/ReviewQuestion.jsx).

### Backend Source Structure (`backend/`)
- [backend/app/__init__.py](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/__init__.py): Initializer configuring Blueprints, database connections, CORS rules, and rate limits.
- [backend/app/models.py](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/models.py): Relational database models (AcademicYear, Subject, User, FacultyAssignment, CourseOutcome, Question, Paper, Section, PaperQuestion, QuestionUsage, AILog, SystemSetting, QuestionReviewStep).
- [backend/app/routes/](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/routes):
  - [auth.py](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/routes/auth.py): Logins, registrations, permissions, and JWT token issuing.
  - [questions.py](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/routes/questions.py): Question management, search indexes, filters, and approvals.
  - [papers.py](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/routes/papers.py): Composing, validation, and document export endpoints.
  - [ai.py](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/routes/ai.py): LLM prompting endpoints.
- [backend/app/services/](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/services):
  - [ai_provider.py](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/services/ai_provider.py): Local/Cloud inference abstractions.
  - [export_service.py](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/services/export_service.py): Compiles JSON fields into `.docx` and `.tex` formats.
  - [validation_service.py](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/services/validation_service.py): Exam paper validation rules.
  - [rbac_service.py](file:///C:/Users/muzam/Desktop/qpgs-ui/backend/app/services/rbac_service.py): Core authorization utility.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- PostgreSQL (Local instance or Neon connection string)

### 1. Clone & Navigate
```bash
git clone https://github.com/Muzammil0777/QPDS-UI.git
cd QPDS-UI
```

### 2. Backend Environment Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux / MacOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` configuration file in the `backend` directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/qpds_db
SECRET_KEY=your_secure_jwt_secret_key_here
FLASK_ENV=development
GEMINI_API_KEY=your_google_gemini_api_key
HF_API_KEY=your_huggingface_api_token
```

Initialize the database schema and run seed scripts:
```bash
flask db upgrade
python create_admin.py
```

Start the API server:
```bash
flask run
```
The API server runs locally at `http://127.0.0.1:5000`.

### 3. Frontend Interface Setup
Open a new terminal window in the root directory (`QPDS-UI`):
```bash
npm install
npm start
```
The frontend development server will launch and open the web browser automatically at `http://localhost:3000`.

---

## 🧪 Testing Workflows
To run the integration test suite covering RBAC permissions, validation constraints, and document compilation routes:
```bash
cd backend
python -m pytest
```

---

## 👥 Contributors

Built by the students of M.S. Ramaiah University as part of the Question Paper Design System initiative.
