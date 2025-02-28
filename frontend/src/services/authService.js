import api from './api';

/**
 * Login a user with username and password
 * @param {string} username - Username or email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Response data
 */
export const login = async (username, password) => {
  console.log('Login attempt:', { username, usingMock: import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API });
  
  // Verificar se deve usar a API real baseado na variável de ambiente
  if (import.meta.env.VITE_USE_REAL_API === 'true') {
    console.log('Usando API real para login');
    
    // Usar a rota de teste de login para garantir funcionalidade
    const response = await api.post('/auth/test-login', { username, password });
    
    // Salvar token no localStorage
    if (response.data && response.data.data && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      if (response.data.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    }
    
    return response;
  }
  
  // Fallback para mock em desenvolvimento
  if (username === 'admin' && password === 'admin') {
    console.log('Login com credentials admin/admin bem-sucedido');
    const mockToken = 'mock-jwt-token-for-development-only';
    const mockUser = {
      id: 1,
      name: 'Admin User',
      email: 'admin@pandora.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    
    // Salvar token e usuário no localStorage
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    console.log('Mock login successful:', { mockUser });
    
    return { 
      data: { 
        token: mockToken, 
        user: mockUser 
      } 
    };
  } else {
    console.log('Mock login failed: Invalid credentials');
    throw new Error('Invalid credentials');
  }
};

/**
 * Get the current authenticated user
 * @returns {Promise<Object>} - User data
 */
export const getCurrentUser = async () => {
  // Verificar se deve usar a API real baseado na variável de ambiente
  if (import.meta.env.VITE_USE_REAL_API === 'true') {
    console.log('Usando API real para obter usuário atual');
    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.data) {
        // Atualizar o usuário no localStorage
        localStorage.setItem('user', JSON.stringify(response.data.data));
        return response.data.data;
      }
      throw new Error('Dados de usuário inválidos na resposta da API');
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      throw error;
    }
  }
  
  // Para desenvolvimento, retorne o usuário do localStorage
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    console.log('Returning mock user from localStorage:', user);
    return user;
  }
  
  throw new Error('No authenticated user');
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} - Updated user data
 */
export const updateProfile = async (profileData) => {
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...currentUser, ...profileData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  }
  
  return await api.put('/auth/profile', profileData);
};

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Response data
 */
export const changePassword = async (currentPassword, newPassword) => {
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    // Validação simples para o mock
    if (currentPassword !== 'admin') {
      throw new Error('Current password is incorrect');
    }
    return { success: true };
  }
  
  return await api.post('/auth/password', { currentPassword, newPassword });
};

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  // Para desenvolvimento, apenas limpe o localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_REAL_API) {
    await api.post('/auth/logout');
  }
};
