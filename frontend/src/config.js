/**
 * Application configuration
 */

// API URL from environment variable or fallback
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Authentication settings
export const AUTH_TOKEN_KEY = 'pandora_auth_token';
export const AUTH_USER_KEY = 'pandora_auth_user';

// Default pagination limits
export const DEFAULT_PAGE_SIZE = 20;

// Socket configuration
export const SOCKET_OPTIONS = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
};

// Feature flags
export const FEATURES = {
  enableNotifications: true,
  enableAnalytics: true,
  enableFileAttachments: true,
};

// Export constants as default export as well
export default {
  API_URL,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  DEFAULT_PAGE_SIZE,
  SOCKET_OPTIONS,
  FEATURES,
};
