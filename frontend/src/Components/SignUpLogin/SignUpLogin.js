import React, { useState } from "react";
import "./SignUpLogin.css";
import backgroundImage from "../Assets/stallion-logo.webp";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { TextField, InputAdornment, IconButton, MenuItem } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// These are the roles under each category (from your user list)
const userRoles = {
  Organizer: ["Event Organizer/Planner", "Sponsor/Exhibitor"],
  Attendee: ["Speaker", "Learner"],
  Administrator: ["Technical Person", "Executive Personnel"],
  Stakeholder: [
    "Educational Institution/Training Org",
    "Event Management Company",
    "Technology Provider/Platform Dev",
  ],
};

const SignUpLogin = () => {
  // Toggle between Sign Up and Login
  const [isLogin, setIsLogin] = useState(false);

  // Track which user type is selected (Organizer, Attendee, etc.)
  const [selectedUserType, setSelectedUserType] = useState("Organizer");

  // Track which specific role under that user type
  const [selectedRole, setSelectedRole] = useState(userRoles["Organizer"][0]);

  // Main form data
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmpassword: "",
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Show/hide password in the form
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // For password modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const navigate = useNavigate();

  // Switch between sign up / login
  const handleFormSwitch = () => {
    setIsLogin(!isLogin);
    setSignupData({
      fullName: "",
      email: "",
      password: "",
      confirmpassword: "",
    });
    setValidationErrors({});
  };

  // Switch user type (Organizer, Attendee, etc.)
  const handleUserTypeSwitch = (type) => {
    setSelectedUserType(type);
    // Reset the selected role to the first role in that category
    setSelectedRole(userRoles[type][0]);
  };

  // Handle form changes
  const handleChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
    setValidationErrors({});
  };

  // Very basic client-side validation
  const validateForm = () => {
    const errors = {};
    if (!isLogin) {
      // Full name required in sign-up
      if (!signupData.fullName.trim()) {
        errors.fullName = "Please enter your full name.";
      }
      // Email check
      if (!/\S+@\S+\.\S+/.test(signupData.email)) {
        errors.email = "Please enter a valid email.";
      }
      // Confirm password check
      if (signupData.password !== signupData.confirmpassword) {
        errors.confirmpassword = "Passwords do not match.";
      }
    }
    // Basic password length check
    if (signupData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    return errors;
  };

  // Submit sign up or login
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!isLogin) {
      // SIGN UP flow
      try {
        // Example endpoint
        const response = await axios.post("/api/signup", {
          userType: selectedUserType,
          role: selectedRole,
          ...signupData,
        });
        if (response.status === 200) {
          alert("Sign up successful!");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // LOGIN flow
      try {
        // Example endpoint
        const response = await axios.post("/api/login", {
          userType: selectedUserType,
          role: selectedRole,
          email: signupData.email,
          password: signupData.password,
        });
        if (response.status === 200) {
          alert("Login successful!");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Forgot password logic (modal)
  const handlePassword = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setValidationErrors({});
  };

  const handleNewPasswordSubmit = (e) => {
    e.preventDefault();
    // ... your password update logic here ...
    alert("Password updated. Please log in again.");
    handleModalClose();
  };

  return (
    <div className="container">
      {/* LEFT SIDE: background image */}
      <img src={backgroundImage} alt="Concordia" className="image" />

      {/* "Concordia University" text */}
      <div className="peer-title">
        <h2>Concordia University</h2>
      </div>

      {/* Vertical toggle buttons for the 4 user types (on the left image area) */}
      <div className="toggle-container">
        {Object.keys(userRoles).map((type) => (
          <button
            key={type}
            className={`toggle-button ${
              selectedUserType === type ? "active" : ""
            }`}
            onClick={() => handleUserTypeSwitch(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* RIGHT SIDE: form panel */}
      <div className="form-container">
        <h1>{isLogin ? "Login" : "Sign Up"}</h1>

        {/* Show the roles for the chosen user type in a dropdown, if you want. */}
        <TextField
          select
          variant="filled"
          className="textfield"
          label="Select Role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          {userRoles[selectedUserType].map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </TextField>

        {/* Sign Up only: Full Name + Email */}
        {!isLogin && (
          <TextField
            className="textfield"
            error={!!validationErrors.fullName}
            label="Full Name"
            variant="filled"
            name="fullName"
            value={signupData.fullName}
            onChange={handleChange}
            helperText={validationErrors.fullName}
          />
        )}

        {!isLogin && (
          <TextField
            className="textfield"
            error={!!validationErrors.email}
            label="Email"
            variant="filled"
            name="email"
            type="email"
            value={signupData.email}
            onChange={handleChange}
            helperText={validationErrors.email}
          />
        )}

        {/* Both Sign Up & Login: password (and confirm if sign up) */}
        <TextField
          className="textfield"
          error={!!validationErrors.password}
          label="Password"
          variant="filled"
          name="password"
          type={showPassword ? "text" : "password"}
          value={signupData.password}
          onChange={handleChange}
          helperText={validationErrors.password}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={togglePasswordVisibility} edge="end">
                  {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Sign Up only: confirm password */}
        {!isLogin && (
          <TextField
            className="textfield"
            error={!!validationErrors.confirmpassword}
            label="Confirm Password"
            variant="filled"
            name="confirmpassword"
            type="password"
            value={signupData.confirmpassword}
            onChange={handleChange}
            helperText={validationErrors.confirmpassword}
          />
        )}

        <Button
          type="submit"
          variant="contained"
          className="button-signup"
          onClick={handleSubmit}
        >
          {isLogin ? "LOGIN" : "SIGN UP"}
        </Button>

        {/* Toggle between sign up / login */}
        <div className="signup-prompt">
          {isLogin
            ? "Don't have an account? "
            : "Already have an account? "}
          <span className="signup-link" onClick={handleFormSwitch}>
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </div>

        {/* Forgot password link (only show when in login mode) */}
        {isLogin && (
          <div className="password-link" onClick={handlePassword}>
            Forgot your password?
          </div>
        )}
      </div>

      {/* Modal for changing password */}
      {isModalOpen && (
        <div className="container-modal" onClick={handleModalClose}>
          <div className="modal-PSW-content" onClick={(e) => e.stopPropagation()}>
            <h2>Change Password</h2>
            <form onSubmit={handleNewPasswordSubmit}>
              <TextField
                className="textfield"
                label="New Password"
                variant="filled"
                name="newpassword"
                type={showNewPassword ? "text" : "password"}
                // you can store it in state if needed
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleNewPasswordVisibility} edge="end">
                        {showNewPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                className="textfield"
                label="Confirm Password"
                variant="filled"
                name="confirmnewpassword"
                type={showConfirmPassword ? "text" : "password"}
                // store in state if needed
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                        {showConfirmPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <div className="modal-buttons">
                <button className="submitPSW" type="submit">
                  Submit
                </button>
                <button className="closePSW" type="button" onClick={handleModalClose}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUpLogin;
