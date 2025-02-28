import api from './api';
import { mockConversations, mockMessages } from '../mocks/mockData';

/**
 * Get conversations for all accounts
 * @param {Object} filters - Filters for conversations
 * @returns {Promise<Array>} - Conversations
 */
export const getConversations = async (filters = {}) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock conversations in development mode');
    let filteredConversations = [...mockConversations];
    
    // Apply filters
    if (filters.platform) {
      filteredConversations = filteredConversations.filter(conv => conv.platform === filters.platform);
    }
    
    if (filters.accountId) {
      filteredConversations = filteredConversations.filter(conv => conv.accountId === filters.accountId);
    }
    
    if (filters.status) {
      filteredConversations = filteredConversations.filter(conv => conv.status === filters.status);
    }
    
    // Apply sorting
    if (filters.orderBy) {
      const order = filters.order === 'DESC' ? -1 : 1;
      filteredConversations.sort((a, b) => {
        if (a[filters.orderBy] < b[filters.orderBy]) return -1 * order;
        if (a[filters.orderBy] > b[filters.orderBy]) return 1 * order;
        return 0;
      });
    }
    
    // Apply limit
    if (filters.limit) {
      filteredConversations = filteredConversations.slice(0, parseInt(filters.limit));
    }
    
    return Promise.resolve(filteredConversations);
  }
  
  const response = await api.get('/conversations', { params: filters });
  return response.data.data;
};

/**
 * Get conversation by ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Conversation data
 */
export const getConversationById = async (conversationId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock conversation in development mode');
    const conversation = mockConversations.find(conv => conv.id === conversationId);
    if (!conversation) {
      return Promise.reject(new Error('Conversation not found'));
    }
    return Promise.resolve(conversation);
  }
  
  const response = await api.get(`/conversations/${conversationId}`);
  return response.data.data;
};

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} filters - Filters for messages
 * @returns {Promise<Array>} - Messages
 */
export const getMessages = async (conversationId, filters = {}) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock messages in development mode');
    let filteredMessages = mockMessages.filter(msg => msg.conversationId === conversationId);
    
    // Apply filters
    if (filters.fromTimestamp) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.timestamp) >= new Date(filters.fromTimestamp)
      );
    }
    
    if (filters.toTimestamp) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.timestamp) <= new Date(filters.toTimestamp)
      );
    }
    
    // Apply sorting
    filteredMessages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Apply limit
    if (filters.limit) {
      filteredMessages = filteredMessages.slice(0, parseInt(filters.limit));
    }
    
    return Promise.resolve(filteredMessages);
  }
  
  const response = await api.get(`/conversations/${conversationId}/messages`, { 
    params: filters 
  });
  return response.data.data;
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} text - Message text
 * @param {string} platform - Platform (whatsapp, instagram)
 * @returns {Promise<Object>} - The sent message data
 */
export const sendMessage = async (conversationId, text, platform) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock sendMessage in development mode');
    const conversation = mockConversations.find(conv => conv.id === conversationId);
    if (!conversation) {
      return Promise.reject(new Error('Conversation not found'));
    }
    
    // Create new message
    const newMessage = {
      id: `msg-${conversationId}-${mockMessages.length + 1}`,
      conversationId,
      text,
      from: conversation.accountId,
      fromType: 'account',
      timestamp: new Date().toISOString(),
      status: 'sent',
      read: true,
      platform
    };
    
    // Add to messages
    mockMessages.push(newMessage);
    
    // Update conversation last message
    conversation.lastMessage = text;
    conversation.lastMessageTimestamp = newMessage.timestamp;
    conversation.updatedAt = newMessage.timestamp;
    
    return Promise.resolve(newMessage);
  }
  
  const response = await api.post(`/conversations/${conversationId}/messages`, {
    text,
    platform
  });
  return response.data.data;
};

/**
 * Mark conversation as read
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Response data
 */
export const markAsRead = async (conversationId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock markAsRead in development mode');
    const conversation = mockConversations.find(conv => conv.id === conversationId);
    if (!conversation) {
      return Promise.reject(new Error('Conversation not found'));
    }
    
    // Mark messages as read
    mockMessages.forEach(msg => {
      if (msg.conversationId === conversationId) {
        msg.read = true;
      }
    });
    
    // Update conversation
    conversation.unreadCount = 0;
    
    return Promise.resolve({ success: true });
  }
  
  return await api.put(`/conversations/${conversationId}/read`);
};

/**
 * Archive conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Response data
 */
export const archiveConversation = async (conversationId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock archiveConversation in development mode');
    const conversation = mockConversations.find(conv => conv.id === conversationId);
    if (!conversation) {
      return Promise.reject(new Error('Conversation not found'));
    }
    
    // Update conversation status
    conversation.status = 'archived';
    
    return Promise.resolve({ success: true });
  }
  
  return await api.put(`/conversations/${conversationId}/archive`);
};

/**
 * Unarchive conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} - Response data
 */
export const unarchiveConversation = async (conversationId) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock unarchiveConversation in development mode');
    const conversation = mockConversations.find(conv => conv.id === conversationId);
    if (!conversation) {
      return Promise.reject(new Error('Conversation not found'));
    }
    
    // Update conversation status
    conversation.status = 'active';
    
    return Promise.resolve({ success: true });
  }
  
  return await api.put(`/conversations/${conversationId}/unarchive`);
};

/**
 * Get messages by account
 * @param {string} accountId - Account ID
 * @param {string} platform - Platform (whatsapp, instagram)
 * @param {Object} filters - Filters for messages
 * @returns {Promise<Array>} - Messages
 */
export const getMessagesByAccount = async (accountId, platform, filters = {}) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock getMessagesByAccount in development mode');
    let filteredMessages = mockMessages.filter(msg => msg.from === accountId && msg.platform === platform);
    
    // Apply filters
    if (filters.fromTimestamp) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.timestamp) >= new Date(filters.fromTimestamp)
      );
    }
    
    if (filters.toTimestamp) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.timestamp) <= new Date(filters.toTimestamp)
      );
    }
    
    // Apply sorting
    filteredMessages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Apply limit
    if (filters.limit) {
      filteredMessages = filteredMessages.slice(0, parseInt(filters.limit));
    }
    
    return Promise.resolve(filteredMessages);
  }
  
  const response = await api.get(`/messages`, { 
    params: { 
      accountId, 
      platform,
      ...filters 
    } 
  });
  return response.data.data;
};

/**
 * Search messages
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} - Messages
 */
export const searchMessages = async (query, filters = {}) => {
  // For development without a backend
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    console.log('Using mock searchMessages in development mode');
    let filteredMessages = mockMessages.filter(msg => msg.text.includes(query));
    
    // Apply filters
    if (filters.fromTimestamp) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.timestamp) >= new Date(filters.fromTimestamp)
      );
    }
    
    if (filters.toTimestamp) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.timestamp) <= new Date(filters.toTimestamp)
      );
    }
    
    // Apply sorting
    filteredMessages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Apply limit
    if (filters.limit) {
      filteredMessages = filteredMessages.slice(0, parseInt(filters.limit));
    }
    
    return Promise.resolve(filteredMessages);
  }
  
  const response = await api.get(`/messages/search`, { 
    params: { 
      query,
      ...filters 
    } 
  });
  return response.data.data;
};

// Export all methods as a default export
export default {
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
  markAsRead,
  archiveConversation,
  unarchiveConversation,
  getMessagesByAccount,
  searchMessages,
};
