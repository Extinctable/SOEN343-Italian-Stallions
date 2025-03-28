import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import LandingPage from "./Components/LandingPage/LandingPage.js";
import HeaderExport from "./Components/Header/HeaderExport.js";
// import HeaderMain from "./Components/Header/HeaderMain";
import SignUpLogin from "./Components/SignUpLogin/SignUpLogin.js";
import Footer from "./Components/Footer/Footer.js";
import NavBar from "./Components/NavBar.jsx";
import LoginForm from "./Components/LoginForm.jsx";
import SignUpPage from "./Components/SignUp/SignUp.js";
import AboutUs from "./Components/AboutUsPage/AboutUs.js";
import Contact from "./Components/Contact/Contact.js";
import UserAnalytics from './Components/Analytics/UserAnalytics.jsx';
import HomePage from "./Components/HomePage/HomePage.jsx";
import AccountSettings from "./Components/AccountSettings/AccountSettings.jsx";
//import Network from "./Components/Network/Network.js";
//import Message from "./Components/Message/Message.js";
import { useUser, UserProvider } from "./context/UserContext.js";


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

// function MainLayout() {
//   const location = useLocation();
//   const hideNavOnAuthPages = 
//     location.pathname === "/login" || 
//     location.pathname === "/signuplogin" ||
//     location.pathname === "/signup" ||
//     location.pathname === "/landing";

//   return (
//     <>
//       {!hideNavOnAuthPages && <NavBar />}
//       <div className="home">
//         <Routes>
//           <Route path="/" element={<Navigate to="/home" />} />
//           <Route path="/home" element={<Home />} />
//           <Route path="/Book-Session" element={<About />} />
//           <Route path="/contact" element={<Contact />} />
//           <Route path="/login" element={<LoginForm />} />
//           <Route path="/signup" element={<SignUpPage />} />
//           <Route path="/about-us" element={<AboutUs />} />
//           <Route path="/Analytics" element={<UserAnalytics />} />
//           <Route path="/Account" element={<AccountSettings />} />
//           <Route path="/Network" element={<Network />} />
//           <Route path="/Message" element={<Message />} />

//         </Routes>
//       </div>
//     </>
//   );
// }

function MainLayout() {
  const location = useLocation();
  const { user } = useUser(); // Get user state

  const hideNavOnAuthPages =
    location.pathname === "/login" 
    location.pathname === "/signuplogin" 
    location.pathname === "/signup" ||
    location.pathname === "/landing";

    return (
      <>
        {!hideNavOnAuthPages && <NavBar />}

        
        {!user ? (
          <div className="guest">
            <Routes>
              <Route path="/" element={<Navigate to="/landing" />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/signuplogin" element={<SignUpLogin />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </div>
        ) : (
          
          <div className="home">
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/Book-Session" element={<About />} />
              <Route path="/contact" element={<Contact />} />
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
