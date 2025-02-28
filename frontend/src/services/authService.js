import api from './api';

/**
 * Login a user with username and password
 * @param {string} username - Username or email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Response data
 */
export const login = async (username, password) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock login in development mode');
    if (username === 'admin' && password === 'admin') {
      const mockToken = 'mock-jwt-token-for-development-only';
      const mockUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@pandora.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { data: { token: mockToken, user: mockUser } };
    } else {
      throw new Error('Invalid credentials');
    }
  }
  
  return await api.post('/auth/login', { username, password });
};

/**
 * Get the current authenticated user
 * @returns {Promise<Object>} - User data
 */
export const getCurrentUser = async () => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock getCurrentUser in development mode');
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }
  
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch (error) {
    // If token is invalid, clear it
    localStorage.removeItem('token');
    return null;
  }
};

/**
 * Update the user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - Updated user data
 */
export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  return response.data.data;
};

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Response data
 */
export const changePassword = async (currentPassword, newPassword) => {
  return await api.put('/auth/change-password', { currentPassword, newPassword });
};

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  // No backend call required if using JWT
  // Just clear token from localStorage
  localStorage.removeItem('token');
};
