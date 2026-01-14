# Question Paper Generation and Distribution System (QPDS)

A comprehensive, AI-powered system designed to streamline the entire lifecycle of question paper management for educational institutions. QPDS enables faculty to collaboratively create, review, and distribute high-quality question papers while providing administrators with robust oversight tools.

## 🚀 Live Demo

- **Frontend (Vercel):** [QPDS-UI](https://qpds-ui.vercel.app/) _(Redirects to Login on Get Started)_
- **Backend (Render):** [QPDS-API](https://qpds-ui.onrender.com)
- **Database (Neon):** PostgreSQL (Managed)

## ✨ Key Features

### 🎓 For Faculty
- **Smart Question Creation:** 
  - Rich text editor (EditorJS) with support for **text alignment**, images, tables, and lists.
  - **Mathematical Equation Support**: Easy input for MathML and LaTeX equations using MathJax.
- **AI-Assisted Tools:** Leverage AI (Google Gemini / Hugging Face) for optimizing question phrasing and generating alternatives.
- **Dashboard:** View assigned subjects, manage draft questions, and track question approval status.
- **Question Bank:** Organized repository of questions filterable by Academic Year, Semester, and Subject.

### 🛡️ For Administrators
- **Faculty Management:** Approve new faculty registrations and manage user roles (Admin/Faculty).
- **Subject Management:** Create and assign subjects to specific faculty members.
- **Course Outcomes (COs):** Define and map Course Outcomes to subjects.
- **Question Paper Generation:** Generate complete question papers based on blueprints and difficulty levels.
- **Print-Ready Export:** Generate clean, standardized PDF outputs for printing.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Styling:** Material UI (MUI) + Custom CSS
- **Editor:** EditorJS with custom Alignment Tunes
- **State Management:** React Context API
- **Routing:** React Router DOM v6

### Backend
- **Framework:** Flask (Python 3.11+)
- **Database ORM:** SQLAlchemy
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** Bcrypt hashing, CAPTCHA integration
- **AI Integration:** Google Generative AI (Gemini), Hugging Face Hub

### Database & Cloud
- **Database:** PostgreSQL (Neon Serverless)
- **Hosting:** Vercel (Frontend), Render (Backend)
- **Version Control:** GitHub

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- PostgreSQL (Local or Cloud URL)

### 1. Clone the Repository
```bash
git clone https://github.com/Muzammil0777/QPDS-UI.git
cd QPDS-UI
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

**Configure Environment Variables:**
Create a `.env` file in the `backend` folder:
```env
DATABASE_URL=postgresql://user:password@localhost/qpds_db
SECRET_KEY=your_secret_key
FLASK_ENV=development
GEMINI_API_KEY=your_gemini_key
HF_API_KEY=your_huggingface_key
```

**Initialize Database:**
```bash
flask db upgrade
# Create initial admin user
python create_admin.py
```

**Run Server:**
```bash
flask run
```

### 3. Frontend Setup
Open a new terminal in the root directory:
```bash
npm install
# Remove windows-specific dependencies if on Linux/Mac
# npm remove @rollup/rollup-win32-x64-msvc 

npm start
```
The app will open at `http://localhost:3000`.

## ☁️ Cloud Deployment
This project is configured for seamless cloud deployment.

### Backend (Render)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `flask db upgrade && gunicorn run:app`
- **Env Vars:** `DATABASE_URL` (Internal Neon URL), `SECRET_KEY`, `GEMINI_API_KEY`, `HF_API_KEY`.

### Frontend (Vercel)
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Env Vars:** `VITE_API_URL` -> `https://your-render-backend.onrender.com`

## 👥 Contributors
Built by the students of M.S. Ramaiah University as part of the Question Paper Design System initiative.

---
*Note: For the admin login credentials in the live demo, please contact the repository owner.*
