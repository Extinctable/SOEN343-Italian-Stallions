import React from "react";
import "./signup.css";

const Signup = () => {
  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form className="signup-form">
        <input type="text" placeholder="Last Name" required />
        <input type="text" placeholder="First Name" required />
        <input type="password" placeholder="Password" required />
        <input type="email" placeholder="Email" required />
        <textarea placeholder="Description"></textarea>
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default Signup;