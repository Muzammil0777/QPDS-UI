import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <div className="page-container">
      <h1>Welcome to QPDS Portal</h1>
      <p>
        This Question Paper Generation and Distribution System (QPDS) allows
        faculty to create, review, and manage question banks efficiently.
      </p>

      <button className="primary-btn" onClick={handleGetStarted}>
        Get Started
      </button>
    </div>
  );
}

export default Home;
