import React, { useState } from "react";
import "./LoginForm.css"; // Import the CSS file
import { useNavigate } from "react-router-dom";

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
      const response = await fetch("http://localhost:5002/check-credentials", {
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

      if (response.ok) {
        // ✅ Store email in localStorage on success
        localStorage.setItem("userEmail", email);

        console.log("Login successful!");
        navigate("/home"); // Redirect to home page on successful login
      } else {
        setErrorMessage(data.message || "Invalid email or password.");
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
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
        filter: "brightness(0.75)",
        height: "100vh",
        width: "100vw",
      }}
    >
      <img className="image_for_login" src="./Assets/stallion-logo.webp" alt="stallion logo" />
      <img className="Inverted_image_for_login" src="./Assets/inverted_logo.png" alt="stallion logo" />

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

        {errorMessage && (
          <p style={{ color: "red", marginTop: "1rem" }}>{errorMessage}</p>
        )}

        <p>
          Don't have an account? <a href="/signup" className="a2">Sign up!</a>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
