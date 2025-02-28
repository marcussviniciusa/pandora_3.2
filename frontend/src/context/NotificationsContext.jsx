import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { createSocketEventHandlers } from '../services/socketEvents';

// Create the context
const NotificationsContext = createContext();

/**
 * NotificationsProvider component to manage application notifications
 */
export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { socket, connected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      // Add new notification at the beginning of the array
      const updated = [
        { 
          ...notification, 
          id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          read: false,
          timestamp: notification.timestamp || new Date().toISOString()
        },
        ...prev
      ];
      
      // Keep only the most recent 50 notifications
      return updated.slice(0, 50);
    });
    
    // Update unread count
    setUnreadCount(prev => prev + 1);
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    
    // Recalculate unread count
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      return newCount;
    });
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Set up socket event handlers
  useEffect(() => {
    if (!isAuthenticated || !socket || !connected) return;

    // Create event handlers
    const eventHandlers = createSocketEventHandlers(socket, addNotification);
    
    // Register handlers
    eventHandlers.registerHandlers();
    
    // Clean up event listeners on unmount
    return () => {
      eventHandlers.unregisterHandlers();
    };
  }, [isAuthenticated, socket, connected, addNotification]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

// Custom hook to use the notifications context
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export default NotificationsContext;
