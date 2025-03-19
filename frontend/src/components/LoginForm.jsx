import React, { useState } from "react";
import "./LoginForm.css"; // Import the CSS file
import { useNavigate } from "react-router-dom"; 
// import { checkUserCredentials } from "../server";
 

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate(); 
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Email:", email);
    console.log("Password:", password);

    // Make an API call to check credentials
    try {
      const response = await fetch("http://localhost:5002/check-credentials", {//  /check-credentials
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();
      
      // Check if the credentials are valid
      if (response.ok) {
        console.log("Login successful!");
        navigate("/home"); // Redirect to the home page on successful login
      } else {
        setErrorMessage(data.message || "Invalid email or password."); // Set the error message if login fails
      }
    } catch (err) {
      console.error("Error checking credentials:", err);
      setErrorMessage("An error occurred. Please try again.");
    }
  };


  return (
<div
  className="LoginPage"
  style={{
    backgroundImage: "url('/background_for_login.png')",
    backgroundSize: "cover", // Ensures the image covers the entire page
    backgroundPosition: "top center", // Aligns the image properly
    backgroundRepeat: "no-repeat",
    filter: "brightness(0.75)",
    height: "100vh", // Ensures full screen
    width: "100vw",
  }}
>
<img className="image_for_login" src= "/stallion-logo.webp" alt="stallion logo"/>
    <img className="Inverted_image_for_login" src= "/inverted_logo.png" alt="stallion logo"/>
    <div className="login-box">
      <p>Login</p>
      <form onSubmit={handleSubmit}>
        <div className="user-box">
          <input 
            type="email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <label>Email</label>
        </div>

        <div className="user-box">
          <input 
            type="password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <label>Password</label>
        </div>

        <button type="submit" className="submit-button">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          Submit
        </button>
      </form>

      <p>
        Don't have an account? <a href="#" className="a2">Sign up!</a>
      </p>
    </div>
    </div>
  );
}

export default LoginForm;
