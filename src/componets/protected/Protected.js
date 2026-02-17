import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserProfile from "../user_dashboard/UserProfile";

const Protected = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  // If role-based protection is specified and user's role is not allowed
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on user's role
    if (user?.role === 'admin') {
      return <Navigate to="/AdminDashBoard" replace />;
    } else if (user?.role === 'staffadmin') {
      return <Navigate to="/StaffDashBoard" replace />;
    } else if (user?.role === 'vendor') {
      return <Navigate to="/VendorDashBoard" replace />;
    } else {
      return <Navigate to="/UserDashBoard" replace />;
    }
  }

  // If all checks pass, render the children
  return children;
};

export default Protected;
