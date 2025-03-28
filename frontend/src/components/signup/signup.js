import React, { useState } from 'react';
import axios from 'axios';
import { 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  IconButton, 
  InputAdornment 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import "./SignUp.css";

const SignUp = () => {
  // State for form data
  const [formData, setFormData] = useState({
    userType: '',
    category: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationName: ''
  });

  // State for form validation and visibility
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // User type categories based on the system description
  const userCategories = {
    Organizers: [
      'Event Organizers and Planners',
      'Sponsors and Exhibitors'
    ],
    Attendees: [
      'Speakers',
      'Learners'
    ],
    AdministrativeUsers: [
      'Technical Person',
      'Executive Personnel'
    ],
    Stakeholders: [
      'Educational Institutions',
      'Event Management Companies',
      'Technology Providers'
    ]
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Password validation
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // User type and category validation
    if (!formData.userType) {
      newErrors.userType = 'Please select a user type';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Full name validation for non-organizational users
    if (!formData.organizationName && !formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Prepare payload based on user type
      const payload = {
        email: formData.email,
        password: formData.password,
        userType: formData.userType,
        category: formData.category,
        ...(formData.organizationName && { organizationName: formData.organizationName }),
        ...(formData.fullName && { fullName: formData.fullName })
      };

      // Adjust API endpoint based on user type
      const endpoint = `/api/signup/${formData.userType.toLowerCase()}`;
      
      const response = await axios.post(endpoint, payload);

      // Handle successful signup
      if (response.status === 200) {
        alert('Signup successful!');
        // Redirect or navigate to appropriate page
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert(error.response?.data?.message || 'Signup failed');
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

      <form onSubmit={handleSubmit}>
        <h2>Event System Sign Up</h2>

        {/* User Type Selection */}
        <FormControl fullWidth error={!!errors.userType}>
          <InputLabel>User Type</InputLabel>
          <Select
            name="userType"
            value={formData.userType}
            label="User Type"
            onChange={handleChange}
          >
            {Object.keys(userCategories).map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Category Selection */}
        {formData.userType && (
          <FormControl fullWidth error={!!errors.category}>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              label="Category"
              onChange={handleChange}
            >
              {userCategories[formData.userType].map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Full Name or Organization Name */}
        {formData.userType !== 'Stakeholders' ? (
          <TextField
            fullWidth
            name="fullName"
            label="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            error={!!errors.fullName}
            helperText={errors.fullName}
          />
        ) : (
          <TextField
            fullWidth
            name="organizationName"
            label="Organization Name"
            value={formData.organizationName}
            onChange={handleChange}
            error={!!errors.organizationName}
            helperText={errors.organizationName}
          />
        )}

        {/* Email */}
        <TextField
          fullWidth
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
        />

        {/* Password */}
        <TextField
          fullWidth
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {/* Confirm Password */}
        <TextField
          fullWidth
          name="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={handleChange}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          fullWidth
        >
          Sign Up
        </Button>
      </form>
};

export default SignUp;