import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CreateQuestion from "./pages/CreateQuestion";
import About from "./pages/About"; // optional, if you have it

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Default route — when user visits "/" */}
        <Route path="/" element={<Home />} />

        {/* Other pages */}
        <Route path="/home" element={<Home />} />
        <Route path="/create" element={<CreateQuestion />} />
        <Route path="/about" element={<About />} />

        {/* Redirect any unknown path to Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
