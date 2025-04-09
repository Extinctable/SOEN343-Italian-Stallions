import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./NavBar.css";

/**
 * A direct React conversion of the original HTML structure:
 * - <nav class="sidebar close"> ...
 * - We replace <a href="#"> with <NavLink to="/...">
 * - We keep the .close toggle for the collapsed sidebar
 * - We keep a "dark" class on <body> for dark mode
 */
function NavBar() {
  const [isSidebarClosed, setIsSidebarClosed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // For the "Dark mode" text label
  const [modeText, setModeText] = useState("Dark mode");

  // Toggle the sidebar "close" class
  const handleSidebarToggle = () => {
    setIsSidebarClosed((prev) => !prev);
  };

  // Toggle dark mode on the body element
  const handleModeSwitch = () => {
    setDarkMode((prev) => !prev);
  };

  // Update the body class and text label whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      setModeText("Light mode");
    } else {
      document.body.classList.remove("dark");
      setModeText("Dark mode");
    }
  }, [darkMode]);

  return (
    <nav className={`sidebar ${isSidebarClosed ? "close" : ""}`}>
      <header>
        <div className="image-text">
          <span className="image">
           
          <img src={darkMode ? "/stallion-logo-darkmode.png" : "/stallion-logo.webp"} alt="Stallion Logo" />
          </span>
          <div className="text logo-text">
            <span className="name">StallionSpeaks</span>
          </div>
        </div>
        <i className="bx bx-chevron-right toggle" onClick={handleSidebarToggle}></i>
      </header>

      <div className="menu-bar">
        <div className="menu">
          {/* MENU LINKS */}
          <ul className="menu-links">
            <li className="nav-link">
              <NavLink to="/home" className={({ isActive }) => (isActive ? "active-link" : "")}>
                <i className="bx bx-home-alt icon"></i>
                <span className="text nav-text">Home</span>
              </NavLink>
            </li>

            <li className="nav-link">
              <NavLink to="/Book-Session" className={({ isActive }) => (isActive ? "active-link" : "")}>
                <i className="bx bx-time-five icon"></i>
                <span className="text nav-text">Book a Session</span>
              </NavLink>
            </li>

            <li className="nav-link">
              <NavLink to="/Analytics" className={({ isActive }) => (isActive ? "active-link" : "")}>
              <i className="bx bx-bar-chart-alt-2 icon"></i>
                <span className="text nav-text">Analytics</span>
              </NavLink>
            </li>

            <li className="nav-link">
              <NavLink to="/Account" className={({ isActive }) => (isActive ? "active-link" : "")}>
                <i className="bx bx-cog bx-wrench icon"></i>
                <span className="text nav-text">Account Settings</span>
              </NavLink>
            </li>

            <li className="nav-link">
              <NavLink to="/Network" className={({ isActive }) => (isActive ? "active-link" : "")}>
                <i className="bx bx-user-plus icon"></i>
                <span className="text nav-text">Network</span>
              </NavLink>
            </li>
            
            <li className="nav-link">
              <NavLink to="/Message" className={({ isActive }) => (isActive ? "active-link" : "")}>
                <i className="bx bx-message icon"></i>
                <span className="text nav-text">Message</span>
              </NavLink>
            </li>

          </ul>
        </div>

        {/* BOTTOM CONTENT (Logout + Dark Mode Switch) */}
        <div className="bottom-content">
          <li>
            <a href="/login">
              <i className="bx bx-log-out icon"></i>
              <span className="text nav-text">Logout</span>
            </a>
          </li>

          <li className="mode">
            <div className="sun-moon">
              <i className="bx bx-moon icon moon"></i>
              <i className="bx bx-sun icon sun"></i>
            </div>
            <span className="mode-text text">{modeText}</span>
            <div className="toggle-switch" onClick={handleModeSwitch}>
              <span className="switch"></span>
            </div>
          </li>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
