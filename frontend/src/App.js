import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";

import LandingPage from "./Components/LandingPage/LandingPage";
import HeaderExport from "./Components/Header/HeaderExport";
// import HeaderMain from "./Components/Header/HeaderMain";
import Footer from "./Components/Footer/Footer";
import NavBar from "./Components/NavBar";
import LoginForm from "./Components/LoginForm";
import SignUp from "./Components/SignUp/SignUp"; // First sign up page
import SignUpLogin from "./Components/SignUpLogin/SignUpLogin"; // Sign up and login together
import AboutUs from "./Components/AboutUsPage/AboutUs";
import Contact from "./Components/Contact/Contact";
import UserAnalytics from './Components/Analytics/UserAnalytics';
import HomePage from "./Components/HomePage/HomePage.jsx";
import AccountSettings from "./Components/AccountSettings/AccountSettings";

import { UserProvider } from "./context/UserContext"; 

import "./App.css"; // any global styles

function Home() {
  return <HomePage />; 
}

function About() {
  return (
    <div>
      <h2>About Page</h2>
      <AboutUs />
    </div>
  );
}

function MainLayout() {
  const location = useLocation();
  const hideNavOnAuthPages = 
    location.pathname === "/login" || 
    location.pathname === "/signuplogin" ||
    location.pathname === "/signup" ||
    location.pathname === "/landing";

  return (
    <>
      {!hideNavOnAuthPages && <NavBar />}
      
      {/* Render LandingPage outside of the .home div */}
      {location.pathname === "/landing" ? (
        <LandingPage />
      ) : (
        <div className="home">
          <Routes>
            <Route path="/" element={<Navigate to="/landing" />} />
            <Route path="/home" element={<Home />} />
            <Route path="/Book-Session" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signuplogin" element={<SignUpLogin />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/Analytics" element={<UserAnalytics />} />
            <Route path="/Account" element={<AccountSettings />} />
          </Routes>
        </div>
      )}
    </>
  );
}


function App() {
  return (
    <UserProvider> {/* ✅ Wrap the whole app */}
      <Router>
        <Routes>
          <Route path="/*" element={<MainLayout />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/header" element={<HeaderExport />} />
          <Route path="/footer" element={<Footer />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
