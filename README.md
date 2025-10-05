# QPDS-UI - Question Paper Design System

A web-based Question Paper Generation and Distribution System that enables faculty to create, manage, and distribute question papers efficiently.

## 🎯 Overview

QPDS-UI is an AI-powered Question Paper Design System that helps automate question creation, validation, and secure distribution. The system provides an intuitive interface for faculty members to create questions with support for text, images, mathematical equations (MathML and LaTeX), and export them for further use.

## ✨ Features

- **Multi-format Question Support**: Create questions using text, images, MathML, and LaTeX
- **Academic Organization**: Filter by academic year, semester, and subject code
- **Flexible Input Methods**: 
  - Individual question entry
  - Bulk upload support
- **Live Preview**: Real-time preview of questions with mathematical notation rendering
- **Mathematical Equations**: Full support for MathML and LaTeX rendering using MathJax
- **Export Functionality**: Save question sets as JSON files
- **Smooth Animations**: Enhanced user experience with Framer Motion page transitions
- **Responsive Design**: Mobile-friendly interface

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Routing**: React Router DOM v6
- **Animations**: Framer Motion
- **Math Rendering**: better-react-mathjax (MathJax integration)
- **Styling**: Custom CSS
- **Build Tool**: Create React App

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher) or yarn (v1.22.0 or higher)

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Muzammil0777/QPDS-UI.git
```

2. Navigate to the project directory:
```bash
cd QPDS-UI
```

3. Install dependencies:
```bash
npm install
```

### Running the Application

Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

### Building for Production

Create an optimized production build:
```bash
npm run build
```

The build files will be generated in the `build/` folder.

## 📁 Project Structure

```
QPDS-UI/
├── public/
├── src/
│   ├── components/
│   │   └── Navbar.js          # Navigation component
│   ├── pages/
│   │   ├── Home.js             # Landing page
│   │   ├── CreateQuestion.js   # Question creation interface
│   │   └── About.js            # About page
│   ├── App.js                  # Main application component
│   ├── App.css                 # Application styles
│   ├── index.js                # Application entry point
│   └── index.css               # Global styles
├── package.json
└── README.md
```

## 🎨 Pages

### Home Page
- Welcome screen with project introduction
- Quick access to question creation portal

### Create Question Page
- **Department Criteria Section**: Select Academic Year, Semester, and Subject Code
- **Input Type Selection**: Choose between individual or bulk question entry
- **Question Input**: 
  - Text input for question description
  - Image upload support
  - MathML input field
  - LaTeX equation input
  - Live preview of all content
- **Export**: Save all questions as a JSON file

### About Page
- Information about QPDS
- Project background and team details

## 💡 Usage Guide

### Creating Questions

1. **Select Academic Details**:
   - Choose Academic Year (e.g., 2024-25)
   - Select Semester (1-8)
   - Pick Subject Code

2. **Choose Input Type**:
   - Individual: Enter questions one by one
   - Bulk: Upload multiple questions via file

3. **Enter Questions**:
   - Type question text
   - Upload images if needed
   - Add mathematical equations using MathML or LaTeX
   - Preview your question in real-time

4. **Save**:
   - Click "Save as JSON" to export your question set

### Mathematical Notation Examples

**LaTeX Example**:
```
\frac{a}{b}
```

**MathML Example**:
```xml
<math>
  <mfrac>
    <mi>a</mi>
    <mi>b</mi>
  </mfrac>
</math>
```

## 🔧 Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Team

Built by students of M.S. Ramaiah University

## 🚧 Future Enhancements

- Backend API integration
- Database support for question storage
- User authentication and authorization
- Question bank management
- PDF export functionality
- Advanced filtering and search
- Question difficulty tagging
- Bloom's Taxonomy classification
- Collaborative editing features


**Note**: This is an academic project developed as part of the Question Paper Design System initiative at M.S. Ramaiah University.
