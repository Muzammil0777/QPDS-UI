import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        background: "#111827",
        color: "white",
        padding: "15px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <h2 style={{ margin: 0, color: "#fff", fontWeight: "bold" }}>QPDS</h2>
      <div style={{ display: "flex", gap: "25px" }}>
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/create-question" className="nav-link">
          Create Question
        </Link>
        <Link to="/about" className="nav-link">
          About Us
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
