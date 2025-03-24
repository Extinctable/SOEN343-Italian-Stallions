import React, {useState} from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";


import HeaderMain from "./components/Header/HeaderMain"; // Header
import Footer from "./components/Footer/Footer"; // Footer
import NavBar from "./components/NavBar"; // The NavBar
import LoginForm from "./components/LoginForm"; // The LoginForm
import AboutUs from "./components/AboutUsPage/AboutUs"; // About us
import Contact from "./components/Contact/Contact"; // Contact us
import "./App.css"; // any global styles

function Home() {
  return <h2>Home Page balls</h2>;
}

function About() {
  return <div>
  <h2>About Page</h2>
  <AboutUs /> {}
</div>;
}

/* function Contact() {
  const redirectToAnotherPage = true; // Set this to the condition for redirecting
//select* from users;
  if (redirectToAnotherPage) {
    // This will redirect to '/some-other-page' immediately after rendering Contact
    return <Navigate to="/contact.js" />;
  }


  return <h2>Contact Page</h2>;
}
*/



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
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/Book-Session" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/about-us" element={<AboutUs />} />
        </Routes>
      </div>
    </>
  );
}

/**
 * The main application component.
 * Sets up routing and displays the appropriate components.
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* MainLayout wraps most pages */}
        <Route path="/*" element={<MainLayout />} />

        {/* About Us is separate and renders on its own */}
        <Route path="/about-us" element={<AboutUs />} />

        {/* Header renders on its own for debugging */}
        <Route path="/header" element={<HeaderMain />} />

        {/* Footer renders on its own for debugging */}
        <Route path="/footer" element={<Footer />} />

        {/* Contact Us renders on its own for debugging */}
        <Route path="/contact" element={<Contact />} />

      </Routes>
    </Router>
  );
}

export default App;
