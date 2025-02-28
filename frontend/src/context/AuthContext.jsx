import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

/**
 * Authentication provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Load user on mount or token change
  useEffect(() => {
    // Skip loading user if no token exists
    if (!token) {
      setLoading(false);
      return;
    }
    
    const loadUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
        // If the token is invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  /**
   * Login a user
   * @param {string} username - Username
   * @param {string} password - Password
   */
  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      
      // Adaptação para diferentes formatos de resposta (API real ou mock)
      let userData, newToken;
      
      if (response.data.data) {
        // Formato de resposta da API
        userData = response.data.data.user;
        newToken = response.data.data.token;
      } else {
        // Formato de resposta do mock no authService.js
        userData = response.data.user;
        newToken = response.data.token;
      }
      
      // Save token to localStorage
      localStorage.setItem('token', newToken);
      
      // Update state
      setToken(newToken);
      setUser(userData);
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout the current user
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token and user state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  /**
   * Update user profile
   * @param {Object} profileData - User profile data
   */
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
