// src/componets/pages/Login.js
import UserProfile from "../user_dashboard/UserProfile";
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import the useAuth hook

import { Container } from 'react-bootstrap';
import "../../assets/css/login.css";

const Login = () => {
  const { login } = useAuth(); // Use the auth context
  const [role, setRole] = useState('admin'); // Default role is 'admin'
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [adminId, setAdminId] = useState('');
  const [staffAdminId, setStaffAdminId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Clear previous errors
    setIsLoading(true);

    try {
      let requestBody = {};
      let endpoint = "https://mahadevaaya.com/spindo/spindobackend/api/login/";

      // Prepare request body based on role
      if (role === 'customer') {
        requestBody = {
          mobile_number: emailOrPhone,
          password: password,
          role: 'customer'
        };
      } else if (role === 'staffadmin') {
        requestBody = {
          mobile_number: staffAdminId,
          password: password,
          role: 'staffadmin'
        };
      } else if (role === 'admin') {
        requestBody = {
          mobile_number: adminId,
          password: password,
          role: 'admin'
        };
      } else if (role === 'vendor') {
        requestBody = {
          mobile_number: email,
          password: password,
          role: 'vendor'
        };
      }

      // ...removed console.log...

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      // ...removed console.log...

      // Check if the response was successful
      if (!response.ok) {
        // Handle field-specific errors (e.g., { errors: { mobile_number: ["Invalid mobile number"] } })
        let errorMsg = data.message || `Request failed with status ${response.status}`;
        if (data.errors && typeof data.errors === 'object') {
          // Map specific error for mobile_number
          errorMsg = Object.entries(data.errors)
            .map(([field, msgs]) => {
              if (
                field === 'mobile_number' &&
                Array.isArray(msgs) &&
                msgs.includes('Invalid mobile number')
              ) {
                return 'Enter Valid mobile number';
              }
              return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
            })
            .join(' | ');
        }
        throw new Error(errorMsg);
      }

      // Check if the API returned a successful status
      if (data.status === true) {
        // Role validation
        const apiRole = data.data.role;
        
        // Map the selected role to the API role format
        let expectedApiRole;
        switch(role) {
          case 'staffadmin':
            expectedApiRole = 'staffadmin';
            break;
          case 'admin':
            expectedApiRole = 'admin';
            break;
          case 'vendor':
            expectedApiRole = 'vendor';
            break;
          case 'customer':
          default:
            expectedApiRole = 'customer';
            break;
        }

        // Verify the role matches
        if (apiRole !== expectedApiRole) {
          throw new Error("Invalid Credential");
        }

        // Use the login function from AuthContext
        login({
          access: data.data.access,
          refresh: data.data.refresh,
          role: data.data.role,
          unique_id: data.data.unique_id,
          mobile_number: data.data.mobile_number
        });

        // Role-based redirection logic
        let redirectTo;
        if (data.data.role === 'admin') {
          redirectTo = "/AdminDashBoard";
        } else if (data.data.role === 'staffadmin') {
          redirectTo = "/StaffDashBoard";
        } else if (data.data.role === 'vendor') {
          redirectTo = "/VendorDashBoard";
        } else if (data.data.role === 'customer') {
          redirectTo = "/UserDashBoard";
        } 

        // Redirect the user to their role-specific dashboard
        navigate(redirectTo, { replace: true });
      } else {
        // Handle field-specific errors for non-200 responses as well
        let errorMsg = data.message || "Login failed. Please check your credentials.";
        if (data.errors && typeof data.errors === 'object') {
          errorMsg = Object.entries(data.errors)
            .map(([field, msgs]) => {
              if (
                field === 'mobile_number' &&
                Array.isArray(msgs) &&
                msgs.includes('Invalid mobile number')
              ) {
                return 'Enter Valid mobile number';
              }
              return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
            })
            .join(' | ');
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      // ...removed console.error...
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get the appropriate title based on selected role
  const getLoginTitle = () => {
    switch(role) {
      case 'admin':
        return 'Admin Login';
      case 'staffadmin':
        return 'Staff Admin Login';
      case 'vendor':
        return 'Vendor Login';
      case 'customer':
        return 'Customer Login';
      default:
        return 'Customer Login';
    }
  };

  return (
    <Container className='login-box-two'>
    <Container className='login-con'>
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-box">
        <div className="login-header">
          <h1>{getLoginTitle()}</h1>
        </div>
        
        {/* Display error message if it exists */}
        {error && <div className="error-message">{error}</div>}
        
        {/* Role Selection Tabs */}
        <div className="role-tabs">
          <button 
            className={`role-tab ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            <i className="fas fa-user-cog"></i>
            <span>Admin</span>
          </button>
          <button 
            className={`role-tab ${role === 'staffadmin' ? 'active' : ''}`}
            onClick={() => setRole('staffadmin')}
          >
            <i className="fas fa-user-shield"></i>
            <span>Staff Admin</span>
          </button>
          <button 
            className={`role-tab ${role === 'vendor' ? 'active' : ''}`}
            onClick={() => setRole('vendor')}
          >
            <i className="fas fa-store"></i>
            <span>VENDOR</span>
          </button>
          <button 
            className={`role-tab ${role === 'customer' ? 'active' : ''}`}
            onClick={() => setRole('customer')}
          >
            <i className="fas fa-user"></i>
            <span>CUSTOMER</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {/* Customer Login Fields */}
          {role === 'customer' && (
            <>
              <div className="form-group">
                <label htmlFor="emailOrPhone">Mobile Number</label>
                <input
                  type="text"
                  id="emailOrPhone"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* Staff Admin Login Fields */}
          {role === 'staffadmin' && (
            <>
              <div className="form-group">
                <label htmlFor="staffAdminId">Mobile Number</label>
                <input
                  type="text"
                  id="staffAdminId"
                  value={staffAdminId} 
                  onChange={(e) => setStaffAdminId(e.target.value)}
                  required placeholder='9999999999' 
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Admin Login Fields */}
          {role === 'admin' && (
            <>
              <div className="form-group">
                <label htmlFor="adminId">Mobile Number</label>
                <input
                  type="text"
                  id="adminId"
                  value={adminId} 
                  onChange={(e) => setAdminId(e.target.value)}
                  required placeholder='9999999999' 
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* Vendor Login Fields */}
          {role === 'vendor' && (
            <>
              <div className="form-group">
                <label htmlFor="email">Mobile Number</label>
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
            </>
          )}
          <div className="d-flex justify-content-center">
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>Logging in...</span>
              </div>
            ) : (
              'Log In'
            )}
          </button>
          </div>
          <div className="text-center forgot-password-section">
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => navigate('/ForgotPassword')}
              disabled={isLoading}
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  </Container>
  </Container>
  );
};

export default Login;