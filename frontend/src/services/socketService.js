import { io } from 'socket.io-client';

// Define socket instance
let socket;

// Socket events
export const EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // WhatsApp events
  WA_QR_CODE: 'wa:qr_code',
  WA_STATUS_CHANGE: 'wa:status_change',
  WA_CONNECTION_STATE: 'wa:connection_state',
  WA_MESSAGE: 'wa:message',
  WA_READY: 'wa:ready',
  WA_BATTERY: 'wa:battery',
  WA_AUTHENTICATED: 'wa:authenticated',
  WA_AUTHENTICATION_FAILURE: 'wa:auth_failure',
  WA_RECONNECTING: 'wa:reconnecting',
  WA_DISCONNECTED: 'wa:disconnected',
  
  // System events
  SYSTEM_STATUS: 'system:status',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_NOTIFICATION: 'system:notification',
};

/**
 * Initialize socket connection
 * @param {object} options - Socket connection options
 * @returns {object} - Socket instance
 */
export const initSocket = (options = {}) => {
  // Set default URL based on environment
  const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
  
  // Close previous connection if exists
  if (socket) {
    socket.close();
  }
  
  // Configure socket
  const socketOptions = {
    path: '/socket.io',
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    ...options,
  };
  
  // Create new socket connection
  socket = io(socketUrl, socketOptions);
  
  // Return socket instance
  return socket;
};

/**
 * Get socket instance
 * @returns {object} - Socket instance
 */
export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

/**
 * Check if socket is connected
 * @returns {boolean} - Is socket connected
 */
export const isConnected = () => {
  return socket && socket.connected;
};

/**
 * Subscribe to WhatsApp events for a specific account
 * @param {string} accountId - Account ID
 */
export const subscribeToWhatsAppEvents = (accountId) => {
  if (!socket) {
    initSocket();
  }
  
  socket.emit('subscribe:whatsapp', { accountId });
};

/**
 * Unsubscribe from WhatsApp events for a specific account
 * @param {string} accountId - Account ID
 */
export const unsubscribeFromWhatsAppEvents = (accountId) => {
  if (socket) {
    socket.emit('unsubscribe:whatsapp', { accountId });
  }
};

/**
 * Subscribe to system events
 */
export const subscribeToSystemEvents = () => {
  if (!socket) {
    initSocket();
  }
  
  socket.emit('subscribe:system');
};

/**
 * Unsubscribe from system events
 */
export const unsubscribeFromSystemEvents = () => {
  if (socket) {
    socket.emit('unsubscribe:system');
  }
};

/**
 * Close socket connection
 */
export const closeConnection = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export default {
  EVENTS,
  initSocket,
  getSocket,
  isConnected,
  subscribeToWhatsAppEvents,
  unsubscribeFromWhatsAppEvents,
  subscribeToSystemEvents,
  unsubscribeFromSystemEvents,
  closeConnection,
};
