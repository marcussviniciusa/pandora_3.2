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
    const loadUser = async () => {
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Error loading user:', error);
          // If the token is invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
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
      const { token: newToken, user: userData } = response.data.data;
      
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
      console.error('Error during logout:', error);
    } finally {
      // Clear token and user state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      toast.success('Logout realizado com sucesso');
    }
  };

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   */
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      toast.success('Perfil atualizado com sucesso');
      return updatedUser;
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
      throw error;
    }
  };

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Senha alterada com sucesso');
    } catch (error) {
      toast.error('Erro ao alterar senha');
      throw error;
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return user?.roles?.includes(role) || false;
  };

  // Context value to be provided to consumers
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
