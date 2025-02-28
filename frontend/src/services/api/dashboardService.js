/**
 * Dashboard API Services
 * Handles all dashboard-related API calls
 */
import api from '../api';

/**
 * Get system status information
 * @returns {Promise<Object>} The system status
 */
export const getSystemStatus = async () => {
  try {
    const response = await api.get('/dashboard/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching system status:', error);
    throw error;
  }
};

/**
 * Get system performance metrics
 * @returns {Promise<Object>} System performance metrics
 */
export const getPerformanceMetrics = async () => {
  try {
    const response = await api.get('/dashboard/performance');
    return response.data;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
};

/**
 * Get activity logs
 * @param {number} limit - Number of logs to retrieve
 * @returns {Promise<Array>} Activity logs
 */
export const getActivityLogs = async (limit = 10) => {
  try {
    const response = await api.get('/dashboard/activity', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

/**
 * Get status history for analytics
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Promise<Array>} Status history
 */
export const getStatusHistory = async (startDate, endDate) => {
  try {
    const response = await api.get('/dashboard/status/history', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching status history:', error);
    throw error;
  }
};

/**
 * Get account statistics 
 * @returns {Promise<Object>} Account statistics
 */
export const getAccountStats = async () => {
  try {
    const response = await api.get('/dashboard/accounts/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching account statistics:', error);
    throw error;
  }
};

/**
 * Get conversation statistics
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Promise<Object>} Conversation statistics
 */
export const getConversationStats = async (startDate, endDate) => {
  try {
    const response = await api.get('/dashboard/conversations/stats', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching conversation statistics:', error);
    throw error;
  }
};

/**
 * Get comprehensive analytics data
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Promise<Object>} Comprehensive analytics data
 */
export const getAnalyticsData = async (startDate, endDate) => {
  try {
    const response = await api.get('/dashboard/analytics', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

export default {
  getSystemStatus,
  getPerformanceMetrics,
  getActivityLogs,
  getStatusHistory,
  getAccountStats,
  getConversationStats,
  getAnalyticsData
};
