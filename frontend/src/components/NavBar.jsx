import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./NavBar.css";
import darkLogo from './Assets/stallion-logo-darkmode.png';
import lightLogo from './Assets/stallion-logo.webp';


function NavBar() {
  const [isSidebarClosed, setIsSidebarClosed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [modeText, setModeText] = useState("Dark mode");

  const userRole = localStorage.getItem("user_role");
  const userCategory = localStorage.getItem("user_category");

  const handleSidebarToggle = () => {
    setIsSidebarClosed((prev) => !prev);
  };

  const handleModeSwitch = () => {
    setDarkMode((prev) => !prev);
  };

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
            <img src={darkMode ? darkLogo : lightLogo} alt="Stallion Logo" />
          </span>
          <div className="text logo-text">
            <span className="name">StallionSpeaks</span>
          </div>
        </div>
        <i className="bx bx-chevron-right toggle" onClick={handleSidebarToggle}></i>
      </header>

      <div className="menu-bar">
        <div className="menu">
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

            {/* Admin Dashboards */}
            {userRole === "administrator" && userCategory === "Technical personnel" && (
              <li className="nav-link">
                <NavLink to="/admin-technical" className={({ isActive }) => (isActive ? "active-link" : "")}>
                  <i className="bx bx-wrench icon"></i>
                  <span className="text nav-text">Technical Panel</span>
                </NavLink>
              </li>
            )}

            {userRole === "administrator" && userCategory === "Executive personnel" && (
              <li className="nav-link">
                <NavLink to="/admin-executive" className={({ isActive }) => (isActive ? "active-link" : "")}>
                  <i className="bx bx-briefcase icon"></i>
                  <span className="text nav-text">Executive Panel</span>
                </NavLink>
              </li>
            )}
            <li className="nav-link">
              <NavLink to="/FinancialManager" className={({ isActive }) => (isActive ? "active-link" : "")}>
              <i className="bx bx-dollar-circle icon"></i>
                <span className="text nav-text">Finance</span>
              </NavLink>
            </li>

            <li className="nav-link">
              <NavLink to="/EventManager" className={({ isActive }) => (isActive ? "active-link" : "")}>
              <i className="bx bx-calendar icon"></i>
                <span className="text nav-text">Events</span>
              </NavLink>
            </li>
            <li className="nav-link">
              <NavLink to="/notifications" className={({ isActive }) => (isActive ? "active-link" : "")}>
                <i className="bx bx-bell icon"></i>
                <span className="text nav-text">Notifications</span>
              </NavLink>
            </li>


          </ul>
        </div>

        <div className="bottom-content">
          <li>
            <a href="/landing">
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
