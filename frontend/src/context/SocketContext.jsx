import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { SOCKET_EVENTS } from '../services/socketEvents';

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
  const [activeSocket, setActiveSocket] = useState(socket || createMockSocket());
  
  useEffect(() => {
    let newSocket = null;

    // Don't create a real socket in development mode unless specifically requested
    if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_SOCKET) {
      const mockSocket = createMockSocket();
      if (mockSocket) {
        setActiveSocket(mockSocket);
        setConnected(true);
      }
      return;
    }
    
    // If a socket was provided as a prop, use it
    if (socket && socket !== activeSocket) {
      setActiveSocket(socket);
      return;
    }
    
    // Otherwise create a new socket
    if (!activeSocket && !import.meta.env.DEV) {
      try {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
        
        newSocket = io(socketUrl, {
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
        return;
      }
    }
    
    const socketToUse = newSocket || activeSocket;
    if (!socketToUse) return;
    
    // Connection events
    const onConnect = () => {
      console.log('Socket connected');
      setConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
    };
    
    const onDisconnect = (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    };
    
    const onError = (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message || 'Connection error');
      toast.error('Erro de conexão com o servidor');
    };
    
    const onReconnectAttempt = (attempt) => {
      console.log(`Socket reconnect attempt: ${attempt}`);
      setReconnectAttempts(attempt);
    };
    
    const onReconnectFailed = () => {
      console.log('Socket reconnect failed');
      setConnectionError('Failed to reconnect after multiple attempts');
      toast.error('Não foi possível reconectar ao servidor após várias tentativas');
    };
    
    // Register event handlers
    socketToUse.on('connect', onConnect);
    socketToUse.on('disconnect', onDisconnect);
    socketToUse.on('error', onError);
    socketToUse.on('connect_error', onError);
    socketToUse.on('reconnect_attempt', onReconnectAttempt);
    socketToUse.on('reconnect_failed', onReconnectFailed);
    
    // Clean up event listeners
    return () => {
      if (socketToUse) {
        socketToUse.off('connect', onConnect);
        socketToUse.off('disconnect', onDisconnect);
        socketToUse.off('error', onError);
        socketToUse.off('connect_error', onError);
        socketToUse.off('reconnect_attempt', onReconnectAttempt);
        socketToUse.off('reconnect_failed', onReconnectFailed);
        
        // Only close if we created this socket
        if (newSocket) {
          socketToUse.disconnect();
        }
      }
    };
  }, [token, socket, activeSocket]);

  useEffect(() => {
    let socketInstance = null;

    // Only create socket connection if user is authenticated
    if (user && token) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
      
      // Create socket instance
      socketInstance = io(socketUrl, {
        auth: {
          token,
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        transports: ['websocket'],
      });

      // Socket connection events
      socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('Socket connected');
        setConnected(true);
        
        // Start ping for latency measurement
        startPingInterval(socketInstance);
      });

      socketInstance.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
        
        if (reason === 'io server disconnect') {
          // The server has forcefully disconnected the socket
          toast.error('Desconectado do servidor. Reconectando...');
        }
      });

      socketInstance.on(SOCKET_EVENTS.CONNECTION_ERROR, (error) => {
        console.error('Socket connection error:', error);
        toast.error('Erro de conexão com o servidor em tempo real');
      });
      
      // WhatsApp events
      socketInstance.on(SOCKET_EVENTS.ACCOUNT_QR_CODE, (data) => {
        if (data.platform === 'whatsapp') {
          toast.success(`QR Code disponível para ${data.phoneNumber}`);
        }
      });
      
      socketInstance.on(SOCKET_EVENTS.ACCOUNT_CONNECTED, (data) => {
        if (data.platform === 'whatsapp') {
          toast.success(`WhatsApp conectado: ${data.phoneNumber}`);
        } else if (data.platform === 'instagram') {
          toast.success(`Instagram conectado: ${data.username}`);
        }
      });
      
      socketInstance.on(SOCKET_EVENTS.ACCOUNT_DISCONNECTED, (data) => {
        if (data.platform === 'whatsapp') {
          toast.error(`WhatsApp desconectado: ${data.phoneNumber}`);
        } else if (data.platform === 'instagram') {
          toast.error(`Instagram desconectado: ${data.username}`);
        }
      });
      
      // New message event
      socketInstance.on(SOCKET_EVENTS.NEW_MESSAGE, (data) => {
        const platform = data.platform === 'whatsapp' ? 'WhatsApp' : 'Instagram';
        toast(`Nova mensagem de ${data.sender || 'Desconhecido'} (${platform})`, {
          icon: '📨',
        });
      });

      setActiveSocket(socketInstance);
    }

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user, token]);

  // Function to measure socket latency
  const startPingInterval = (socketInstance) => {
    const pingInterval = setInterval(() => {
      if (!socketInstance || !socketInstance.connected) {
        clearInterval(pingInterval);
        return;
      }
      
      const start = Date.now();
      
      socketInstance.emit(SOCKET_EVENTS.PING, null, () => {
        const latency = Date.now() - start;
        console.log('Socket latency:', latency);
      });
    }, 5000); // Ping every 5 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(pingInterval);
  };

  return (
    <SocketContext.Provider value={{ socket: activeSocket, connected, reconnectAttempts, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Hook for using socket context
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
