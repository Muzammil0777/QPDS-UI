import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react"; // lightweight icons
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h2 className="logo">QPDS</h2>

        {/* Hamburger Icon (mobile) */}
        <div className="menu-icon" onClick={toggleMenu}>
          {menuOpen ? <X size={26} color="#fff" /> : <Menu size={26} color="#fff" />}
        </div>

        {/* Navigation Links */}
        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li>
            <NavLink to="/" onClick={closeMenu} end>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/create" onClick={closeMenu}>
              Create Question
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" onClick={closeMenu}>
              About
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
