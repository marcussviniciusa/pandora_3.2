/**
 * Socket events for the Pandora Messaging Platform
 * This file provides constants for WebSocket event names
 */

/**
 * Constants for WebSocket events used in the application
 */
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECTION_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  ERROR: 'error',
  PING: 'ping',
  
  // Instagram events
  INSTAGRAM_ACTIVITY: 'instagram_activity',
  INSTAGRAM_DIRECT: 'instagram_direct',
  
  // WhatsApp events
  WHATSAPP_ACTIVITY: 'whatsapp_activity',
  WHATSAPP_MESSAGE: 'whatsapp_message',
  WHATSAPP_GROUP: 'whatsapp_group',
  
  // Account events
  ACCOUNT_STATUS_CHANGE: 'account_status_change',
  ACCOUNT_QR_CODE: 'account_qr_code',
  ACCOUNT_CONNECTED: 'account_connected',
  ACCOUNT_DISCONNECTED: 'account_disconnected',
  
  // Message events
  NEW_MESSAGE: 'new_message',
  MESSAGE_STATUS_CHANGE: 'message_status_change',
  MESSAGE_STATUS_UPDATE: 'message_status_update',
  MESSAGE_READ: 'message_read',
  MESSAGE_DELIVERED: 'message_delivered',
  
  // Notification events
  NOTIFICATION: 'notification',
  SYSTEM_NOTIFICATION: 'system_notification',
  
  // Conversation events
  CONVERSATION_CREATED: 'conversation_created',
  CONVERSATION_UPDATED: 'conversation_updated',
  
  // User events
  USER_ACTIVITY: 'user_activity',
  USER_STATUS_CHANGE: 'user_status_change',
};

/**
 * Socket event handlers
 * @param {Object} socket - Socket.io instance
 * @param {Function} addNotification - Function to add a notification
 * @returns {Object} - Object with methods to register and unregister event handlers
 */
export const createSocketEventHandlers = (socket, addNotification) => {
  const handlers = {};
  
  // Register event handlers
  const registerHandlers = () => {
    // Account status change handler
    handlers.accountStatusChange = (data) => {
      console.log('Account status changed:', data);
      const statusText = data.status === 'connected' ? 'conectada' : 
                         data.status === 'disconnected' ? 'desconectada' : 
                         data.status === 'connecting' ? 'conectando' : data.status;
      
      const platformName = data.platform === 'whatsapp' ? 'WhatsApp' : 
                          data.platform === 'instagram' ? 'Instagram' : data.platform;
      
      addNotification({
        type: 'account',
        title: `Status da conta ${platformName}`,
        content: `A conta ${data.name || data.phoneNumber} está ${statusText}`,
        platform: data.platform,
        accountId: data.accountId,
        status: data.status,
      });
    };
    
    // New message handler
    handlers.newMessage = (data) => {
      console.log('New message received:', data);
      addNotification({
        type: 'message',
        title: `Nova mensagem de ${data.sender || 'Contato'}`,
        content: data.preview || 'Nova mensagem recebida',
        platform: data.platform,
        accountId: data.accountId,
        conversationId: data.conversationId,
      });
    };
    
    // Error handler
    handlers.error = (data) => {
      console.error('Socket error:', data);
      
      if (data.type === 'auth') {
        // Auth errors are handled separately
        return;
      }
      
      addNotification({
        type: 'error',
        title: 'Erro',
        content: data.message || 'Ocorreu um erro',
        platform: data.platform,
        accountId: data.accountId,
      });
    };
    
    // System notification handler
    handlers.systemNotification = (data) => {
      console.log('System notification:', data);
      addNotification({
        type: 'system',
        title: data.title || 'Notificação do sistema',
        content: data.message || 'Nova notificação do sistema',
      });
    };
    
    // Register all handlers with the socket
    socket.on(SOCKET_EVENTS.ACCOUNT_STATUS_CHANGE, handlers.accountStatusChange);
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handlers.newMessage);
    socket.on(SOCKET_EVENTS.ERROR, handlers.error);
    socket.on(SOCKET_EVENTS.SYSTEM_NOTIFICATION, handlers.systemNotification);
  };
  
  // Unregister event handlers
  const unregisterHandlers = () => {
    if (socket) {
      socket.off(SOCKET_EVENTS.ACCOUNT_STATUS_CHANGE, handlers.accountStatusChange);
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handlers.newMessage);
      socket.off(SOCKET_EVENTS.ERROR, handlers.error);
      socket.off(SOCKET_EVENTS.SYSTEM_NOTIFICATION, handlers.systemNotification);
    }
  };
  
  return {
    registerHandlers,
    unregisterHandlers,
  };
};

export default {
  SOCKET_EVENTS,
  createSocketEventHandlers,
};
