import React, { useState } from "react";
import "./SignUp.css";
import backgroundImage from "../Assets/stallion-logo.webp";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { TextField, InputAdornment, IconButton, MenuItem } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useUser } from "../../context/UserContext";

// Mapping of roles to their respective categories.
const roleCategories = {
  organizer: ["Event organizers", "Sponsors"],
  attendee: ["Speakers", "Learners"],
  administrator: ["Technical personnel", "Executive personnel"],
  stakeholder: ["Educational institutions", "Event management companies", "Technology providers"],
};

// -----------------------------------------
// Strategy Pattern for Login
// -----------------------------------------
class LoginStrategy {
  async login(email, password) {
    throw new Error("Method not implemented");
  }
}

class OrganizerLogin extends LoginStrategy {
  async login(email, password) {
    const url = `http://localhost:5002/login?email=${email}&password=${password}&role=organizer`;
    return await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  }
}

class AttendeeLogin extends LoginStrategy {
  async login(email, password) {
    const url = `http://localhost:5002/login?email=${email}&password=${password}&role=attendee`;
    return await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  }
}

class AdminLogin extends LoginStrategy {
  async login(email, password) {
    const url = `http://localhost:5002/login?email=${email}&password=${password}&role=administrator`;
    return await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  }
}

class StakeholderLogin extends LoginStrategy {
  async login(email, password) {
    const url = `http://localhost:5002/login?email=${email}&password=${password}&role=stakeholder`;
    return await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  }
}

// -----------------------------------------
// SignUp Component
// -----------------------------------------
const SignUp = () => {
  // State for role selection and form fields.
  const [role, setRole] = useState("organizer"); // Default role.
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmpassword: "",
    newpassword: "",
    category: roleCategories["organizer"][0],
  });
  const [isLogin, setIsLogin] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useUser();

  // Toggle visibility functions.
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);

  const validateSignUp = () => {
    const { fullName, email, password, confirmpassword, category } = formData;
    const errors = {};
    if (!/^[a-zA-Z\s]{1,100}$/.test(fullName)) {
      errors.fullName = "Full name is not valid";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email is not valid";
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
      errors.password = "Password must be at least 8 characters, including at least one letter and one number.";
    }
    if (password !== confirmpassword) {
      errors.confirmpassword = "Passwords do not match.";
    }
    if (!category) {
      errors.category = "Please select a category.";
    }
    return errors;
  };

  const validatePasswordReset = () => {
    const { email, newpassword, confirmpassword } = formData;
    const errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email is not valid";
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newpassword)) {
      errors.newpassword = "New password must be at least 8 characters, including at least one letter and one number.";
    }
    if (newpassword !== confirmpassword) {
      errors.confirmpassword = "Passwords do not match.";
    }
    return errors;
  };

  // Handler for sign up.
  const handleSignUp = async (e) => {
    e.preventDefault();
    const errors = validateSignUp();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    const url = "http://localhost:5002/signup";
    try {
      const response = await axios.post(url, {
        role, // "organizer", "attendee", etc.
        category: formData.category,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      if (response.status === 201) {
        console.log("Signup successful");
        navigate("/teams");
      } else {
        console.error("Signup failed");
      }
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };

  // Handler for login using the Strategy Pattern.
  const handleLogin = async (e) => {
    e.preventDefault();
    let strategy;
    if (role === "organizer") {
      strategy = new OrganizerLogin();
    } else if (role === "attendee") {
      strategy = new AttendeeLogin();
    } else if (role === "administrator") {
      strategy = new AdminLogin();
    } else if (role === "stakeholder") {
      strategy = new StakeholderLogin();
    }
    try {
      const response = await strategy.login(formData.email, formData.password);
      if (response.ok) {
        const user = await response.json();
        localStorage.setItem("user_id", user.user_id);
        localStorage.setItem("user_role", role);
        localStorage.setItem("user_category", formData.category);
        console.log("Login Successful:", user);
        navigate("/teams");
      } else {
        const data = await response.json();
        const errorMessage = data.message || "Login failed";
        setValidationErrors({
          general: errorMessage,
          ...(errorMessage.includes("password") && { password: errorMessage }),
          ...(errorMessage.includes("not found") && { email: errorMessage }),
        });
      }
    } catch (error) {
      setValidationErrors({ general: "Error occurred during login" });
      console.error("Error during login:", error);
    }
  };

  // Update formData as the user types.
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setValidationErrors({});
  };

  // Switch roles.
  const handleRoleSwitch = (selectedRole) => {
    setRole(selectedRole);
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmpassword: "",
      newpassword: "",
      category: roleCategories[selectedRole][0],
    });
  };

  // Toggle between sign up and login.
  const handleFormSwitch = () => {
    setIsLogin(!isLogin);
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmpassword: "",
      newpassword: "",
      category: roleCategories[role][0],
    });
    setValidationErrors({});
  };

  // Password reset modal handlers.
  const handlePasswordResetModal = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleNewPassword = async (e) => {
    e.preventDefault();
    const errors = validatePasswordReset();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    const url = "http://localhost:5002/changePassword";
    const data = {
      email: formData.email,
      new_password: formData.newpassword,
    };
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.status === 200) {
        console.log("Password change successful");
        alert("Password updated successfully! Please login with your new password.");
        handleModalClose();
      } else if (response.status === 404) {
        const errorMessage = (await response.json()).message || "User not found.";
        setValidationErrors({
          general: errorMessage,
          ...(errorMessage.includes("not found") && { email: errorMessage }),
        });
      }
    } catch (error) {
      setValidationErrors({ general: "Error occurred during password change" });
      console.error("Error during password change:", error);
    }
  };

  return (
    <div className="container">
      <img src={backgroundImage} alt="Background" className="image" />
      <div className="peer-title">
        <h2>Italian Stallions</h2>
      </div>
      <div className="info">
        <h1>{isLogin ? "Login" : "Sign Up"}</h1>
        <div className="button-role">
          {["organizer", "attendee", "administrator", "stakeholder"].map((item) => (
            <button
              key={item}
              className={`button ${role === item ? "active" : ""}`}
              onClick={() => handleRoleSwitch(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        <form onSubmit={isLogin ? handleLogin : handleSignUp}>
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
                    <IconButton onClick={togglePasswordVisibility} edge="end" sx={{ boxShadow: "none", padding: 0 }}>
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
                      <IconButton onClick={toggleConfirmPasswordVisibility} edge="end" sx={{ boxShadow: "none", padding: 0 }}>
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
          <Button type="submit" variant="contained" className="button-signup">
            {isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>
        <div className="signup-prompt">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={handleFormSwitch} className="signup-link" style={{ cursor: "pointer", color: "#1860C3", textDecoration: "underline" }}>
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </div>
        <span onClick={handlePasswordResetModal} className="password-link" style={{ cursor: "pointer", color: "#1860C3", textDecoration: "underline" }}>
          {isLogin ? "Forgot your password? " : ""}
        </span>
        {isModalOpen && (
          <div className="container-modal" onClick={handleModalClose}>
            <div className="modal-PSW-content" onClick={(e) => e.stopPropagation()}>
              <h2>Change Password</h2>
              <form onSubmit={handleNewPassword}>
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
                          <IconButton onClick={toggleNewPasswordVisibility} edge="end" sx={{ boxShadow: "none", padding: 0 }}>
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
                          <IconButton onClick={toggleConfirmPasswordVisibility} edge="end" sx={{ boxShadow: "none", padding: 0 }}>
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
                <button className="submitPSW" type="submit">Submit</button>
                <button className="closePSW" type="button" onClick={handleModalClose}>
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
