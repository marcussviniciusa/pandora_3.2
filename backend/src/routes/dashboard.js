const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get dashboard analytics data
 * @access  Public (for testing - should be private in production)
 */
router.get('/analytics', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      messagesSent: 0,
      messagesReceived: 0,
      activeAccounts: 0,
      activeConversations: 0,
      messagesByDay: []
    }
  });
});

/**
 * @route   GET /api/dashboard/activity
 * @desc    Get recent activity for dashboard
 * @access  Public (for testing - should be private in production)
 */
router.get('/activity', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  
  res.status(200).json({
    status: 'success',
    count: 0,
    data: []
  });
});

/**
 * @route   GET /api/dashboard/status
 * @desc    Get system status information
 * @access  Public (for testing - should be private in production)
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      whatsappAccounts: {
        total: 0,
        connected: 0,
        disconnected: 0
      },
      instagramAccounts: {
        total: 0,
        connected: 0,
        disconnected: 0
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: process.version
      }
    }
  });
});

module.exports = router;
