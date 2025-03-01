import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { SOCKET_EVENTS } from '../services/socketEvents';
import { useQueryClient } from 'react-query';

// Create socket context
const SocketContext = createContext();

/**
 * Socket provider component
 */
export const SocketProvider = ({ children, socket }) => {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
  // Create a mock socket for development
  const createMockSocket = () => {
    const mockEvents = {};
    
    if (!import.meta.env.DEV || import.meta.env.VITE_USE_REAL_SOCKET) {
      return null;
    }
    
    console.log('Creating mock socket for development');
    
    // Create a mock socket object
    return {
      connected: true,
      id: 'mock-socket-id',
      on: (event, callback) => {
        console.log(`Socket.IO mock: registered event listener for "${event}"`);
        if (!mockEvents[event]) {
          mockEvents[event] = [];
        }
        mockEvents[event].push(callback);
        return this;
      },
      off: (event, callback) => {
        console.log(`Socket.IO mock: removed event listener for "${event}"`);
        if (mockEvents[event]) {
          mockEvents[event] = mockEvents[event].filter(cb => cb !== callback);
        }
        return this;
      },
      emit: (event, ...args) => {
        console.log(`Socket.IO mock: emitted event "${event}" with args:`, args);
        // Simulate callback if last arg is a function
        if (typeof args[args.length - 1] === 'function') {
          const callback = args.pop();
          // Simulate async response
          setTimeout(() => {
            if (event === 'get_activity_logs') {
              callback({
                success: true,
                data: []
              });
            } else {
              callback({
                success: true,
                data: {}
              });
            }
          }, 100);
        }
        return this;
      },
      disconnect: () => {
        console.log('Socket.IO mock: disconnected');
      },
      // Method to simulate receiving an event (for testing)
      _simulateEvent: (event, ...args) => {
        if (mockEvents[event]) {
          mockEvents[event].forEach(callback => callback(...args));
        }
      }
    };
  };
  
  // Use real socket or mock socket
  const [activeSocket, setActiveSocket] = useState(null);
  
  // Initialize socket - only run once or when token changes
  useEffect(() => {
    // Bail if no token or if running in dev without VITE_USE_REAL_SOCKET
    if ((!token && !import.meta.env.DEV) || (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_SOCKET && !activeSocket)) {
      const mockSocket = createMockSocket();
      if (mockSocket && !activeSocket) {
        setActiveSocket(mockSocket);
        setConnected(true);
      }
      return;
    }
    
    // If a socket was provided as a prop or we already have an active socket, don't create a new one
    if (socket || activeSocket) {
      if (socket && socket !== activeSocket) {
        setActiveSocket(socket);
      }
      return;
    }
    
    // Otherwise create a new socket
    try {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      
      const newSocket = io(socketUrl, {
        auth: {
          token: token
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      setActiveSocket(newSocket);
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      setConnectionError(error.message);
    }
    
    // Clean up function
    return () => {
      if (activeSocket && typeof activeSocket.disconnect === 'function') {
        activeSocket.disconnect();
      }
    };
  }, [token, socket]); // Only run when token or socket props change

  // Setup socket event listeners
  useEffect(() => {
    if (!activeSocket) return;

    // Connection event handlers
    const onConnect = () => {
      setConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
      console.log('Socket connected:', activeSocket.id);
    };

    const onDisconnect = (reason) => {
      setConnected(false);
      console.log('Socket disconnected:', reason);
    };

    const onConnectError = (error) => {
      setConnectionError(error.message);
      console.error('Socket connection error:', error);
    };

    const onReconnectAttempt = (attempt) => {
      setReconnectAttempts(attempt);
      console.log(`Socket reconnect attempt ${attempt}`);
    };

    const onReconnectFailed = () => {
      setConnectionError('Failed to reconnect after maximum attempts');
      console.error('Socket reconnection failed');
      toast.error('Não foi possível reconectar ao servidor');
    };

    // Business event handlers
    const onNewMessage = (data) => {
      console.log('New message received:', data);
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <img className="h-10 w-10 rounded-full" src={data.sender?.avatar || '/placeholders/user.png'} alt="" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{data.sender?.name || 'Novo Contato'}</p>
                <p className="mt-1 text-sm text-gray-500">{data.content?.substring(0, 60) || data.message?.body?.substring(0, 60) || 'Nova mensagem'}{data.content?.length > 60 || data.message?.body?.length > 60 ? '...' : ''}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              Ver
            </button>
          </div>
        </div>
      ));
    };
    
    // WhatsApp specific message handler
    const onWhatsAppMessage = (data) => {
      console.log('WhatsApp message received:', data);
      // Invalidate queries to update conversations and messages
      if (queryClient) {
        // Invalidate all WhatsApp conversations
        queryClient.invalidateQueries(['conversations', 'whatsapp']);
        
        // If a specific account is mentioned, invalidate its conversations specifically
        if (data.accountId) {
          queryClient.invalidateQueries(['conversations', 'whatsapp', data.accountId]);
        }
        
        // If there is a message with a conversation ID, invalidate that conversation's messages
        if (data.message && data.message.conversationId) {
          queryClient.invalidateQueries(['conversation-messages', data.message.conversationId]);
        }
        
        // If there is a conversation object directly provided
        if (data.conversation && data.conversation.id) {
          queryClient.invalidateQueries(['conversation-messages', data.conversation.id]);
        }
      }
      
      // Show toast notification
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <img className="h-10 w-10 rounded-full" src="/placeholders/whatsapp.png" alt="" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">WhatsApp: {data.phoneNumber}</p>
                <p className="mt-1 text-sm text-gray-500">{data.message?.body?.substring(0, 60) || 'Nova mensagem'}{data.message?.body?.length > 60 ? '...' : ''}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              Ver
            </button>
          </div>
        </div>
      ));
      
      // Also trigger the general new message handler for consistency
      onNewMessage({
        sender: { name: `WhatsApp (${data.phoneNumber})` },
        content: data.message?.body,
        message: data.message, // Pass the full message object for reference
        conversationId: data.message?.conversationId // Ensure conversation ID is passed
      });
    };
    
    const onWhatsAppMessageSent = (data) => {
      console.log('WhatsApp message sent:', data);
      // Invalidate queries to update conversations and messages
      if (queryClient) {
        // Invalidate all WhatsApp conversations
        queryClient.invalidateQueries(['conversations', 'whatsapp']);
        
        // If a specific account is mentioned, invalidate its conversations specifically
        if (data.accountId) {
          queryClient.invalidateQueries(['conversations', 'whatsapp', data.accountId]);
        }
        
        // If there is a message with a conversation ID, invalidate that conversation's messages
        if (data.message && data.message.conversationId) {
          queryClient.invalidateQueries(['conversation-messages', data.message.conversationId]);
        }
        
        // If there is a conversation object directly provided
        if (data.conversation && data.conversation.id) {
          queryClient.invalidateQueries(['conversation-messages', data.conversation.id]);
        }
      }
    };

    const onSystemNotification = (data) => {
      console.log('System notification received:', data);
      toast(data.message, {
        icon: data.type === 'error' ? '🔴' : data.type === 'warning' ? '🟠' : '🔵',
      });
    };

    const onStatusChange = (data) => {
      console.log('Status change notification:', data);
      // Show UI notification or update UI elements
    };

    // Register event handlers
    activeSocket.on('connect', onConnect);
    activeSocket.on('disconnect', onDisconnect);
    activeSocket.on('connect_error', onConnectError);
    activeSocket.on('reconnect_attempt', onReconnectAttempt);
    activeSocket.on('reconnect_failed', onReconnectFailed);
    
    // Business events
    activeSocket.on(SOCKET_EVENTS.NEW_MESSAGE, onNewMessage);
    activeSocket.on(SOCKET_EVENTS.SYSTEM_NOTIFICATION, onSystemNotification);
    activeSocket.on(SOCKET_EVENTS.STATUS_CHANGE, onStatusChange);
    
    // WhatsApp specific events
    activeSocket.on(SOCKET_EVENTS.WHATSAPP_MESSAGE, onWhatsAppMessage);
    activeSocket.on(SOCKET_EVENTS.WHATSAPP_MESSAGE_SENT, onWhatsAppMessageSent);

    // Auto connect for mock socket in dev mode
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_SOCKET && activeSocket._simulateEvent) {
      setTimeout(() => {
        onConnect();
      }, 100);
    }

    // Cleanup function for event listeners
    return () => {
      if (activeSocket) {
        activeSocket.off('connect', onConnect);
        activeSocket.off('disconnect', onDisconnect);
        activeSocket.off('connect_error', onConnectError);
        activeSocket.off('reconnect_attempt', onReconnectAttempt);
        activeSocket.off('reconnect_failed', onReconnectFailed);
        
        activeSocket.off(SOCKET_EVENTS.NEW_MESSAGE, onNewMessage);
        activeSocket.off(SOCKET_EVENTS.SYSTEM_NOTIFICATION, onSystemNotification);
        activeSocket.off(SOCKET_EVENTS.STATUS_CHANGE, onStatusChange);
        
        // WhatsApp specific events
        activeSocket.off(SOCKET_EVENTS.WHATSAPP_MESSAGE, onWhatsAppMessage);
        activeSocket.off(SOCKET_EVENTS.WHATSAPP_MESSAGE_SENT, onWhatsAppMessageSent);
      }
    };
  }, [activeSocket]); // Only re-run when activeSocket changes

  // Expose socket and connection state
  const value = {
    socket: activeSocket,
    connected,
    connectionError,
    reconnectAttempts,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Hook for using socket context
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
