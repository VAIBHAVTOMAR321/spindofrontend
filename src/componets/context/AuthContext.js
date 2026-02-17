// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Refresh token API endpoint
const REFRESH_TOKEN_URL = 'https://mahadevaaya.com/spindo/spindobackend/api/token/refresh/';

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState({ access: null, refresh: null });
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh access token
  const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
      console.error('No refresh token available.');
      logout();
      return null;
    }
    try {
      const response = await axios.post(REFRESH_TOKEN_URL, {
        refresh: refreshToken
      });
      if (response.data.access) {
        const newTokens = {
          ...tokens,
          access: response.data.access,
          refresh: refreshToken
        };
        setTokens(newTokens);
        return newTokens.access;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      return null;
    }
  };

  // IMPORTANT: This effect runs on app start to check if user was logged in
  // On mount, try to restore session from memory (if available) or refresh token from sessionStorage
  useEffect(() => {
    const restoreSession = async () => {
      // Try to get tokens and user from sessionStorage
      const savedTokens = sessionStorage.getItem('tokens');
      const savedUser = sessionStorage.getItem('user');
      if (savedTokens && savedUser) {
        const parsedTokens = JSON.parse(savedTokens);
        const parsedUser = JSON.parse(savedUser);
        // Try to refresh access token if needed
        if (parsedTokens.refresh) {
          const newAccess = await refreshAccessToken(parsedTokens.refresh);
          if (newAccess) {
            setTokens({ access: newAccess, refresh: parsedTokens.refresh });
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            setTokens({ access: null, refresh: null });
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  // Login function - saves state in React context and sessionStorage
  const login = (userData) => {
    const { access, refresh, role, unique_id, mobile_number } = userData;
    const userInfo = {
      role,
      uniqueId: unique_id,
      mobileNumber: mobile_number
    };
    const newTokens = { access, refresh };
    setTokens(newTokens);
    setUser(userInfo);
    setIsAuthenticated(true);
    // Save to sessionStorage for persistence across refresh
    sessionStorage.setItem('tokens', JSON.stringify(newTokens));
    sessionStorage.setItem('user', JSON.stringify(userInfo));
  };

  // Logout function - clears state in React context and sessionStorage
  const logout = () => {
    setTokens({ access: null, refresh: null });
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('tokens');
    sessionStorage.removeItem('user');
  };

  const value = {
    isAuthenticated,
    user,
    tokens,
    isLoading,
    login,
    logout,
    refreshAccessToken
  };

  // Prevent rendering children until auth state is checked
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;