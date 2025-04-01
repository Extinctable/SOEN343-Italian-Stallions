import React, { useState } from "react";
import "./SignUp.css";
import backgroundImage from "../Assets/stallion-logo-darkmode.png";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { TextField, InputAdornment, IconButton, MenuItem } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const SignUp = () => {
  // Mapping of roles to their respective categories
  const roleCategories = {
    organizer: ["Event organizers", "Sponsors"],
    attendee: ["Speakers", "Learners"],
    administrator: ["Technical personnel", "Executive personnel"],
    stakeholder: ["Educational institutions", "Event management companies", "Technology providers"],
  };

  // State to track the current selected role.
  const [role, setRole] = useState("organizer"); // Default role is "organizer"

  // State to hold the form data.
  // For sign up: fullName, email, password, confirmpassword, and category.
  // For password reset modal, newpassword is used.
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmpassword: "",
    newpassword: "",
    category: roleCategories["organizer"][0],
  });

  // State to determine if the form is in login mode or sign up mode.
  const [isLogin, setIsLogin] = useState(false);
  // State for holding form validation errors.
  const [validationErrors, setValidationErrors] = useState({});
  // State to control the visibility of the password change modal.
  const [isModalOpen, setIsModalOpen] = useState(false);
  // States to toggle password visibility for the various password fields.
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Toggle functions for each password visibility state.
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);
  const toggleNewPasswordVisibility = () =>
    setShowNewPassword(!showNewPassword);

  const navigate = useNavigate();

  // Validation function for sign up / registration.
  const validateSignUp = () => {
    const { fullName, email, password, confirmpassword, category } = formData;
    const errors = {};

    // Validate full name (only letters and spaces, between 1 and 100 characters).
    if (!/^[a-zA-Z\s]{1,100}$/.test(fullName)) {
      errors.fullName = "Full name is not valid";
    }

    // Basic email validation.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email is not valid";
    }

    // Validate password strength: at least 8 characters, with at least one letter and one number.
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
      errors.password =
        "Password must be at least 8 characters, including at least one letter and one number.";
    }

    // Check that password and confirm password match.
    if (password !== confirmpassword) {
      errors.confirmpassword = "Passwords do not match.";
    }

    // Ensure a category is selected.
    if (!category) {
      errors.category = "Please select a category.";
    }

    return errors;
  };

  // Validation function for password reset.
  const validatePasswordReset = () => {
    const { email, newpassword, confirmpassword } = formData;
    const errors = {};

    // Validate email.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email is not valid";
    }

    // Validate new password.
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newpassword)) {
      errors.newpassword =
        "New password must be at least 8 characters, including at least one letter and one number.";
    }

    // Check that new password and confirm password match.
    if (newpassword !== confirmpassword) {
      errors.confirmpassword = "Passwords do not match.";
    }

    return errors;
  };

  // Handler for the sign up form submission.
  const handleSignUp = async (e) => {
    e.preventDefault();
    const errors = validateSignUp();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Use a generic signup endpoint and send the role, category, and other fields.
    const url = "http://localhost:5000/signup";
    try {
      const response = await axios.post(url, {
        role, // role is one of: organizer, attendee, administrator, stakeholder
        category: formData.category,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 200) {
        console.log("Signup successful");
        const userData = response.data;
        // Save the returned user id (or token) to localStorage.
        localStorage.setItem("user_id", userData.user_id);
        console.log("Signed-up user:", userData);
        navigate("/teams");
      } else {
        console.error("Signup failed");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Handler for the login form submission.
  const handleLogin = async (e) => {
    e.preventDefault();
    // For login, only email and password are needed.
    const url = `http://localhost:5000/login?email=${formData.email}&password=${formData.password}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const user = await response.json();
        // Save user id (or token) from the response.
        localStorage.setItem("user_id", user.user_id);
        console.log("Login successful:", user);
        navigate("/teams");
      } else {
        const data = await response.json();
        const errorMessage = data.message || "Login failed";
        setValidationErrors({
          general: errorMessage,
          ...(data.message.includes("password") && { password: errorMessage }),
          ...(data.message.includes("not found") && { email: errorMessage }),
        });
      }
    } catch (error) {
      setValidationErrors({
        general: "Error occurred during login",
      });
      console.error("Error:", error);
    }
  };

  // Handler to update form data when input fields change.
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear previous validation errors when user types.
    setValidationErrors({});
  };

  // Handler for switching between different user roles.
  const handleRoleSwitch = (selectedRole) => {
    setRole(selectedRole);
    // Reset form data when role changes and set default category for the new role.
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmpassword: "",
      newpassword: "",
      category: roleCategories[selectedRole][0],
    });
  };

  // Handler for switching between login and sign up modes.
  const handleFormSwitch = () => {
    setIsLogin(!isLogin);
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmpassword: "",
      newpassword: "",
      // For sign up mode, set default category based on current role.
      category: roleCategories[role][0],
    });
    setValidationErrors({});
  };

  // Open the password reset modal.
  const handlePasswordResetModal = () => {
    setIsModalOpen(true);
  };

  // Close the password reset modal.
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Handler for submitting a new password in the reset modal.
  const handleNewPassword = async (e) => {
    e.preventDefault();
    const errors = validatePasswordReset();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Use a generic endpoint for password change.
    const url = "http://localhost:5000/changePassword";

    const data = {
      email: formData.email,
      new_password: formData.newpassword,
    };

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.status === 200) {
        console.log("Password change successful");
        alert(
          "Password updated successfully! Please login with your new password."
        );
        handleModalClose();
        return;
      }
      if (response.status === 404) {
        const errorMessage =
          response.data?.message || "User not found.";
        setValidationErrors({
          general: errorMessage,
          ...(errorMessage.includes("not found") && { email: errorMessage }),
        });
        return;
      }
    } catch (error) {
      setValidationErrors({
        general: "Error occurred during password change",
      });
      console.error("Error:", error);
    }
  };

  return (
    <div className="container">
      {/* Background image */}
      <img src={backgroundImage} alt="Description" className="image" />

      {/* Application title */}
      <div className="peer-title">
        <h2>Italian Stallions</h2>
      </div>

      {/* Main content area */}
      <div className="info">
        {/* Display either Login or Sign Up title based on mode */}
        <h1>{isLogin ? "Login" : "Sign Up"}</h1>

        {/* Role selection buttons (always visible) */}
        <div className="button-role">
          {["organizer", "attendee", "administrator", "stakeholder"].map(
            (item) => (
              <button
                key={item}
                className={`button ${role === item ? "active" : ""}`}
                onClick={() => handleRoleSwitch(item)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Form for login or sign up */}
        <form onSubmit={isLogin ? handleLogin : handleSignUp}>
          {/* For sign up mode, show Full Name, Email and Category fields */}
          {!isLogin && (
            <>
              <div>
                <TextField
                  className="textfield"
                  error={!!validationErrors.fullName}
                  id="filled-full-name"
                  label="Full Name"
                  variant="filled"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  helperText={validationErrors.fullName}
                  required
                />
              </div>
              <div>
                <TextField
                  className="textfield"
                  error={!!validationErrors.email}
                  id="filled-email"
                  label="Email"
                  variant="filled"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  helperText={validationErrors.email}
                  required
                />
              </div>
              {/* Category dropdown */}
              <div>
                <TextField
                  select
                  className="textfield"
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  variant="filled"
                  helperText={validationErrors.category}
                  required
                >
                  {roleCategories[role].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </div>
            </>
          )}

          {/* For login mode, only show Email field */}
          {isLogin && (
            <div>
              <TextField
                className="textfield"
                error={!!validationErrors.email}
                id="filled-email"
                label="Email"
                variant="filled"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                helperText={validationErrors.email}
                required
              />
            </div>
          )}

          {/* Password field (common to both sign up and login) */}
          <div>
            <TextField
              className="textfield"
              error={!!validationErrors.password}
              id="filled-password"
              label="Password"
              variant="filled"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              helperText={validationErrors.password}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      sx={{ boxShadow: "none", padding: 0 }}
                    >
                      {showPassword ? (
                        <VisibilityIcon sx={{ color: "gray", fontSize: "2rem" }} />
                      ) : (
                        <VisibilityOffIcon sx={{ color: "gray", fontSize: "2rem" }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </div>

          {/* For sign up mode, add Confirm Password field */}
          {!isLogin && (
            <div>
              <TextField
                className="textfield"
                error={!!validationErrors.confirmpassword}
                id="filled-confirm-password"
                label="Confirm Password"
                variant="filled"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmpassword"
                value={formData.confirmpassword}
                onChange={handleChange}
                helperText={validationErrors.confirmpassword}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={toggleConfirmPasswordVisibility}
                        edge="end"
                        sx={{ boxShadow: "none", padding: 0 }}
                      >
                        {showConfirmPassword ? (
                          <VisibilityIcon sx={{ color: "gray", fontSize: "2rem" }} />
                        ) : (
                          <VisibilityOffIcon sx={{ color: "gray", fontSize: "2rem" }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
          )}

          {/* Submit button changes text based on mode */}
          <Button type="submit" variant="contained" className="button-signup">
            {isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>

        {/* Prompt to switch between sign up and login modes */}
        <div className="signup-prompt">
          {isLogin
            ? "Don't have an account? "
            : "Already have an account? "}
          <span
            onClick={handleFormSwitch}
            className="signup-link"
            style={{
              cursor: "pointer",
              color: "#1860C3",
              textDecoration: "underline",
            }}
          >
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </div>

        {/* Link to open password reset modal (only available in login mode) */}
        <div className="change-password"></div>
        <span
          onClick={handlePasswordResetModal}
          className="password-link"
          style={{
            cursor: "pointer",
            color: "#1860C3",
            textDecoration: "underline",
          }}
        >
          {isLogin ? "Forgot your password? " : ""}
        </span>

        {/* Password reset modal */}
        {isModalOpen && (
          <div className="container-modal" onClick={handleModalClose}>
            <div
              className="modal-PSW-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Change Password</h2>
              <form onSubmit={handleNewPassword}>
                {/* Email field for password reset */}
                <div>
                  <TextField
                    className="textfield"
                    error={!!validationErrors.email}
                    id="modal-email"
                    label="Email"
                    variant="filled"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    helperText={validationErrors.email}
                    required
                  />
                </div>
                {/* New Password input with toggle */}
                <div>
                  <TextField
                    className="textfield"
                    error={!!validationErrors.newpassword}
                    id="modal-new-password"
                    label="New Password"
                    variant="filled"
                    type={showNewPassword ? "text" : "password"}
                    name="newpassword"
                    value={formData.newpassword}
                    onChange={handleChange}
                    helperText={validationErrors.newpassword}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={toggleNewPasswordVisibility}
                            edge="end"
                            sx={{ boxShadow: "none", padding: 0 }}
                          >
                            {showNewPassword ? (
                              <VisibilityIcon sx={{ color: "gray", fontSize: "2rem" }} />
                            ) : (
                              <VisibilityOffIcon sx={{ color: "gray", fontSize: "2rem" }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>
                {/* Confirm Password input for password reset */}
                <div>
                  <TextField
                    className="textfield"
                    error={!!validationErrors.confirmpassword}
                    id="modal-confirm-password"
                    label="Confirm Password"
                    variant="filled"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmpassword"
                    value={formData.confirmpassword}
                    onChange={handleChange}
                    helperText={validationErrors.confirmpassword}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={toggleConfirmPasswordVisibility}
                            edge="end"
                            sx={{ boxShadow: "none", padding: 0 }}
                          >
                            {showConfirmPassword ? (
                              <VisibilityIcon sx={{ color: "gray", fontSize: "2rem" }} />
                            ) : (
                              <VisibilityOffIcon sx={{ color: "gray", fontSize: "2rem" }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>
                {/* Submit button for password reset */}
                <button className="submitPSW" type="submit">
                  Submit
                </button>
                {/* Button to close the password reset modal */}
                <button
                  className="closePSW"
                  type="button"
                  onClick={handleModalClose}
                >
                  Close
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;
