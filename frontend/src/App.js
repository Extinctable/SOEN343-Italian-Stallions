import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";

import LandingPage from "./Components/LandingPage/LandingPage";
import HeaderExport from "./Components/Header/HeaderExport";
import Footer from "./Components/Footer/Footer";
import NavBar from "./Components/NavBar";
import LoginForm from "./Components/LoginForm";
import SignUp from "./Components/SignUp/SignUp.js";
import AboutUs from "./Components/AboutUsPage/AboutUs";
import Contact from "./Components/Contact/Contact";
import UserAnalytics from './Components/Analytics/UserAnalytics';
import Message from "./Components/Message/Message";
import Network from "./Components/Network/Network";
import HomePage from "./Components/HomePage/HomePage.jsx";
import AccountSettings from "./Components/AccountSettings/AccountSettings";
import FinancialManager from "./Components/Finance/FinancialManager.jsx";
import EventManager from "./Components/Events/EventManager.jsx";
import Notifications from './Components/Notifications/Notifications';


import Streamer from "./Components/Streamer"; 
import Viewer from "./Components/Viewer";

import AdminTechnicalDashboard from "./Components/Dashboards/AdminTechnical/AdminTechnicalDashboard";

import { UserProvider } from "./context/UserContext"; 

import "./App.css";

// Admin pages
const TechnicalDashboard = () => <h1>Technical Admin Dashboard</h1>;
const ExecutiveDashboard = () => <h1>Executive Admin Dashboard</h1>;

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
    location.pathname === "/signup" ||
    location.pathname === "/landing";

  const userRole = localStorage.getItem("user_role");
  const userCategory = localStorage.getItem("user_category");

  return (
    <>
      {!hideNavOnAuthPages && <NavBar />}
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
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/Analytics" element={<UserAnalytics />} />
            <Route path="/Account" element={<AccountSettings />} />
            <Route path="/network" element={<Network />} />
            <Route path="/message" element={<Message />} />
            <Route path="/FinancialManager" element={<FinancialManager />} />
            <Route path="/EventManager" element={<EventManager />} />
            <Route path="/streamer" element={<Streamer />} />
            <Route path="/viewer" element={<Viewer />} />
            <Route path="/notifications" element={<Notifications />} />


            {/* 🛡️ Admin Dashboards */}
            <Route
              path="/admin-technical"
              element={
                userRole === "administrator" && userCategory === "Technical personnel" 
                  ? <AdminTechnicalDashboard />
                  : <Navigate to="/home" />
              }
            />

            <Route
              path="/admin-executive"
              element={
                userRole === "administrator" && userCategory === "Executive personnel" 
                  ? <ExecutiveDashboard />
                  : <Navigate to="/home" />
              }
            />
          </Routes>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <UserProvider>
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
