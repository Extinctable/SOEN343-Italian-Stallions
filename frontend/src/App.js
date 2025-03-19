import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar"; // The NavBar
import LoginForm from "./components/LoginForm"; // The LoginForm
import "./App.css"; // any global styles

function Home() {
  return <h2>Home Page</h2>;
}

function About() {
  return <h2>About Page</h2>;
}

function Contact() {
  return <h2>Contact Page</h2>;
}

function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

/**
 * Renders the NavBar and Main Content
 */
function MainLayout() {
  const location = useLocation();

  // Hide NavBar on login page
  const hideNavOnLoginPage = location.pathname === "/login";

  return (
    <>
      {/* Show NavBar unless on the login page */}
      {!hideNavOnLoginPage && <NavBar />}

      {/* Main Content */}
      <div className="home">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Book-Session" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </div>
    </>
  );
}

export default App;