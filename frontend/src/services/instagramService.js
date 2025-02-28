import api from './api';
import { mockInstagramAccounts } from '../mocks/mockData';

/**
 * Get all Instagram accounts
 * @returns {Promise<Array>} - Instagram accounts
 */
export const getAccounts = async () => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock Instagram accounts in development mode');
    return Promise.resolve(mockInstagramAccounts);
  }
  
  const response = await api.get('/instagram/accounts');
  return response.data.data;
};

/**
 * Get Instagram account by ID
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - Instagram account
 */
export const getAccountById = async (accountId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock Instagram account in development mode');
    const account = mockInstagramAccounts.find(account => account.id === accountId);
    if (!account) {
      return Promise.reject(new Error('Account not found'));
    }
    return Promise.resolve(account);
  }
  
  const response = await api.get(`/instagram/accounts/${accountId}`);
  return response.data.data;
};

/**
 * Create a new Instagram account
 * @param {string} username - Instagram username
 * @param {string} password - Instagram password
 * @returns {Promise<Object>} - Created account
 */
export const createAccount = async (username, password) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock createAccount in development mode');
    const newAccount = {
      id: `ig${mockInstagramAccounts.length + 1}`,
      username,
      name: username.includes('_') ? username.split('_').join(' ') : username,
      status: 'connected',
      profilePicture: `https://picsum.photos/${200 + mockInstagramAccounts.length}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockInstagramAccounts.push(newAccount);
    return Promise.resolve(newAccount);
  }
  
  const response = await api.post('/instagram/accounts', { username, password });
  return response.data.data;
};

/**
 * Remove an Instagram account
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - Response data
 */
export const removeAccount = async (accountId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock removeAccount in development mode');
    const index = mockInstagramAccounts.findIndex(account => account.id === accountId);
    if (index === -1) {
      return Promise.reject(new Error('Account not found'));
    }
    mockInstagramAccounts.splice(index, 1);
    return Promise.resolve({ success: true });
  }
  
  return await api.delete(`/instagram/accounts/${accountId}`);
};

/**
 * Get Instagram connection status
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - Status data
 */
export const getStatus = async (accountId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock getStatus in development mode');
    const account = mockInstagramAccounts.find(account => account.id === accountId);
    if (!account) {
      return Promise.reject(new Error('Account not found'));
    }
    return Promise.resolve({
      status: account.status,
      lastPing: new Date().toISOString(),
      limitInfo: {
        remaining: 4800,
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    });
  }
  
  const response = await api.get(`/instagram/accounts/${accountId}/status`);
  return response.data.data;
};

/**
 * Reconnect an Instagram account
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - Response data
 */
export const reconnect = async (accountId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock reconnect in development mode');
    const account = mockInstagramAccounts.find(account => account.id === accountId);
    if (!account) {
      return Promise.reject(new Error('Account not found'));
    }
    account.status = 'connected';
    return Promise.resolve({ success: true });
  }
  
  return await api.post(`/instagram/accounts/${accountId}/reconnect`);
};

/**
 * Send direct message on Instagram
 * @param {string} accountId - Account ID
 * @param {string} username - Recipient username
 * @param {string} message - Message content
 * @returns {Promise<Object>} - Sent message data
 */
export const sendMessage = async (accountId, username, message) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock sendMessage in development mode');
    const account = mockInstagramAccounts.find(account => account.id === accountId);
    if (!account) {
      return Promise.reject(new Error('Account not found'));
    }
    return Promise.resolve({
      id: `msg${Math.floor(Math.random() * 1000000)}`,
      from: account.username,
      to: username,
      message,
      status: 'sent',
      createdAt: new Date().toISOString()
    });
  }
  
  const response = await api.post('/instagram/send', { accountId, username, message });
  return response.data.data;
};

/**
 * Get threads for Instagram account
 * @param {string} accountId - Account ID
 * @returns {Promise<Array>} - Thread data
 */
export const getThreads = async (accountId) => {
  const response = await api.get(`/instagram/accounts/${accountId}/threads`);
  return response.data.data;
};

/**
 * Get messages for a specific thread
 * @param {string} accountId - Account ID
 * @param {string} threadId - Thread ID
 * @returns {Promise<Array>} - Message data
 */
export const getThreadMessages = async (accountId, threadId) => {
  const response = await api.get(`/instagram/accounts/${accountId}/threads/${threadId}/messages`);
  return response.data.data;
};

// Export all methods as default export
export default {
  getAccounts,
  getAccountById,
  createAccount,
  removeAccount,
  getStatus,
  reconnect,
  sendMessage,
  getThreads,
  getThreadMessages,
};
