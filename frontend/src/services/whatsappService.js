import api from './api';
import { mockWhatsAppAccounts } from '../mocks/mockData';

/**
 * Get all WhatsApp accounts
 * @returns {Promise<Array>} - WhatsApp accounts
 */
export const getAccounts = async () => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock WhatsApp accounts in development mode');
    return Promise.resolve(mockWhatsAppAccounts);
  }
  
  const response = await api.get('/whatsapp/accounts');
  return response.data.data;
};

/**
 * Get WhatsApp account by ID
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - WhatsApp account
 */
export const getAccountById = async (accountId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock WhatsApp account in development mode');
    const account = mockWhatsAppAccounts.find(account => account.id === accountId);
    if (!account) {
      return Promise.reject(new Error('Account not found'));
    }
    return Promise.resolve(account);
  }
  
  const response = await api.get(`/whatsapp/accounts/${accountId}`);
  return response.data.data;
};

/**
 * Create a new WhatsApp account
 * @param {string} phoneNumber - Phone number with country code
 * @returns {Promise<Object>} - Created account
 */
export const createAccount = async (phoneNumber) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock createAccount in development mode');
    const newAccount = {
      id: `wa${mockWhatsAppAccounts.length + 1}`,
      phoneNumber,
      name: `WhatsApp Account ${mockWhatsAppAccounts.length + 1}`,
      status: 'connected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockWhatsAppAccounts.push(newAccount);
    return Promise.resolve(newAccount);
  }
  
  const response = await api.post('/whatsapp/accounts', { phoneNumber });
  return response.data.data;
};

/**
 * Remove a WhatsApp account
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - Response data
 */
export const removeAccount = async (accountId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock removeAccount in development mode');
    const index = mockWhatsAppAccounts.findIndex(account => account.id === accountId);
    if (index === -1) {
      return Promise.reject(new Error('Account not found'));
    }
    mockWhatsAppAccounts.splice(index, 1);
    return Promise.resolve({ success: true });
  }
  
  return await api.delete(`/whatsapp/accounts/${accountId}`);
};

/**
 * Get WhatsApp connection status
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - Status data
 */
export const getStatus = async (accountId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock getStatus in development mode');
    const account = mockWhatsAppAccounts.find(account => account.id === accountId);
    if (!account) {
      return Promise.reject(new Error('Account not found'));
    }
    return Promise.resolve({
      status: account.status,
      lastPing: new Date().toISOString(),
      battery: {
        level: 85,
        charging: true
      }
    });
  }
  
  const response = await api.get(`/whatsapp/accounts/${accountId}/status`);
  return response.data.data;
};

/**
 * Force reconnection of WhatsApp account
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - Response data
 */
export const reconnect = async (accountId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock reconnect in development mode');
    const account = mockWhatsAppAccounts.find(account => account.id === accountId);
    if (!account) {
      return Promise.reject(new Error('Account not found'));
    }
    account.status = 'connected';
    return Promise.resolve({ success: true });
  }
  
  return await api.post(`/whatsapp/accounts/${accountId}/reconnect`);
};

/**
 * Send WhatsApp message
 * @param {string} accountId - Account ID
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} - Sent message data
 */
export const sendMessage = async (accountId, to, message) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock sendMessage in development mode');
    const account = mockWhatsAppAccounts.find(account => account.id === accountId);
    if (!account) {
      return Promise.reject(new Error('Account not found'));
    }
    return Promise.resolve({
      id: `msg${Math.floor(Math.random() * 1000000)}`,
      from: account.phoneNumber,
      to,
      message,
      status: 'sent',
      createdAt: new Date().toISOString()
    });
  }
  
  const response = await api.post('/whatsapp/send', { accountId, to, message });
  return response.data.data;
};

/**
 * Send bulk WhatsApp messages
 * @param {string} accountId - Account ID
 * @param {Array} recipients - Array of recipients
 * @param {string} message - Message content
 * @returns {Promise<Object>} - Response data
 */
export const sendBulkMessages = async (accountId, recipients, message) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock sendBulkMessages in development mode');
    const account = mockWhatsAppAccounts.find(account => account.id === accountId);
    if (!account) {
      return Promise.reject(new Error('Account not found'));
    }
    const messages = recipients.map(recipient => ({
      id: `msg${Math.floor(Math.random() * 1000000)}`,
      from: account.phoneNumber,
      to: recipient,
      message,
      status: 'sent',
      createdAt: new Date().toISOString()
    }));
    return Promise.resolve(messages);
  }
  
  const response = await api.post('/whatsapp/bulk-send', { 
    accountId, 
    recipients, 
    message 
  });
  return response.data.data;
};

/**
 * Get QR code for WhatsApp account
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - QR code data
 */
export const getQRCode = async (accountId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock getQRCode in development mode');
    const account = mockWhatsAppAccounts.find(account => account.id === accountId);
    if (!account) {
      return Promise.reject(new Error('Account not found'));
    }
    return Promise.resolve({
      qrCode: 'https://example.com/qr-code.png',
      expiresAt: new Date().getTime() + 300000
    });
  }
  
  const response = await api.get(`/whatsapp/qr/${accountId}`);
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
  sendBulkMessages,
  getQRCode,
};
