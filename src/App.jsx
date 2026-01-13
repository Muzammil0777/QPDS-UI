import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminRoute from './components/AdminRoute';
import FacultyRoute from './components/FacultyRoute';
import AdminLayout from './components/AdminLayout';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import FacultyManagement from './pages/admin/FacultyManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import AssignSubjects from './pages/admin/AssignSubjects';
import CourseOutcomes from './pages/admin/CourseOutcomes';
import QuestionPaper from './pages/admin/QuestionPaper';
import QuestionBank from './pages/admin/QuestionBank';
import EditQuestion from './pages/admin/EditQuestion';
import ComposePaper from './pages/admin/ComposePaper';

// Faculty Pages
import FacultyDashboard from './pages/faculty/Dashboard';
import CreateQuestion from './pages/faculty/CreateQuestion';
import FacultySubjectDetails from './pages/faculty/FacultySubjectDetails';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="faculty" element={<FacultyManagement />} />
          <Route path="subjects" element={<SubjectManagement />} />
          <Route path="assign" element={<AssignSubjects />} />
          <Route path="course-outcomes" element={<CourseOutcomes />} />
          <Route path="question-paper" element={<QuestionPaper />} />
          <Route path="question-bank" element={<QuestionBank />} />
          <Route path="edit-question/:questionId" element={<EditQuestion />} />
          <Route path="compose-paper" element={<ComposePaper />} />
        </Route>

        {/* Faculty Routes */}
        <Route path="/faculty" element={
          <FacultyRoute>
            <FacultyDashboard />
          </FacultyRoute>
        } />

        <Route path="/faculty/create-question" element={
          <FacultyRoute>
            <CreateQuestion />
          </FacultyRoute>
        } />

        <Route path="/faculty/subject/:subjectId" element={
          <FacultyRoute>
            <FacultySubjectDetails />
          </FacultyRoute>
        } />

      </Routes>
    </>
  );
}

export default App;
