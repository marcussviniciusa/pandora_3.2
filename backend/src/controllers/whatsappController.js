const whatsappService = require('../services/whatsappService');
const { AccountModel } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all WhatsApp accounts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAccounts = async (req, res, next) => {
  try {
    const accounts = await AccountModel.findAll({
      where: { 
        platform: 'whatsapp',
        active: true 
      },
      attributes: { exclude: ['password'] } // Never return sensitive data
    });
    
    res.status(200).json({
      status: 'success',
      count: accounts.length,
      data: accounts
    });
  } catch (error) {
    logger.error('Error getting WhatsApp accounts:', error);
    next(error);
  }
};

/**
 * Create a new WhatsApp account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createAccount = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    
    // Check if account already exists
    const existingAccount = await AccountModel.findOne({
      where: { 
        platform: 'whatsapp',
        phoneNumber,
        active: true
      }
    });
    
    if (existingAccount) {
      return res.status(400).json({
        status: 'error',
        message: `WhatsApp account with phone number ${phoneNumber} already exists`
      });
    }
    
    // Create new account
    const account = await whatsappService.createAccount(phoneNumber);
    
    // Return account without sensitive data
    const { password, ...accountData } = account.toJSON();
    
    res.status(201).json({
      status: 'success',
      message: 'WhatsApp account created successfully. Scan the QR code to connect.',
      data: accountData
    });
  } catch (error) {
    logger.error('Error creating WhatsApp account:', error);
    next(error);
  }
};

/**
 * Get WhatsApp account by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const account = await AccountModel.findOne({
      where: { 
        id,
        platform: 'whatsapp' 
      },
      attributes: { exclude: ['password'] }
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'WhatsApp account not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: account
    });
  } catch (error) {
    logger.error(`Error getting WhatsApp account ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Remove a WhatsApp account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.removeAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if account exists
    const account = await AccountModel.findOne({
      where: { 
        id,
        platform: 'whatsapp',
        active: true
      }
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'WhatsApp account not found'
      });
    }
    
    // Remove account
    await whatsappService.removeAccount(id);
    
    res.status(200).json({
      status: 'success',
      message: 'WhatsApp account removed successfully'
    });
  } catch (error) {
    logger.error(`Error removing WhatsApp account ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Get WhatsApp connection status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if account exists
    const account = await AccountModel.findOne({
      where: { 
        id,
        platform: 'whatsapp'
      },
      attributes: ['id', 'phoneNumber', 'status', 'lastActivity']
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'WhatsApp account not found'
      });
    }
    
    // Get current status from service
    const status = await whatsappService.getStatus(id);
    
    // Update account status if changed
    if (status !== account.status) {
      account.status = status;
      account.lastActivity = new Date();
      await account.save();
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        id: account.id,
        phoneNumber: account.phoneNumber,
        status,
        lastActivity: account.lastActivity
      }
    });
  } catch (error) {
    logger.error(`Error getting WhatsApp status for account ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Force reconnection of WhatsApp account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.reconnect = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if account exists
    const account = await AccountModel.findOne({
      where: { 
        id,
        platform: 'whatsapp',
        active: true
      }
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'WhatsApp account not found'
      });
    }
    
    // Get client
    const client = whatsappService.getClient(id);
    
    if (!client) {
      // Initialize client if it doesn't exist
      await whatsappService.initializeClient(id, account.phoneNumber);
      
      res.status(200).json({
        status: 'success',
        message: 'WhatsApp client initialization started'
      });
    } else {
      // Handle reconnection for existing client
      await whatsappService.handleReconnection(id, account.phoneNumber);
      
      res.status(200).json({
        status: 'success',
        message: 'WhatsApp reconnection initiated'
      });
    }
  } catch (error) {
    logger.error(`Error reconnecting WhatsApp account ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Send WhatsApp message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { accountId, to, message } = req.body;
    
    // Check if account exists
    const account = await AccountModel.findOne({
      where: { 
        id: accountId,
        platform: 'whatsapp',
        active: true
      }
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'WhatsApp account not found'
      });
    }
    
    // Check account status
    if (account.status !== 'connected') {
      return res.status(400).json({
        status: 'error',
        message: `WhatsApp account is not connected (status: ${account.status})`
      });
    }
    
    // Send message
    const sentMessage = await whatsappService.sendMessage(accountId, to, message);
    
    res.status(200).json({
      status: 'success',
      message: 'Message sent successfully',
      data: sentMessage
    });
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    next(error);
  }
};

/**
 * Send bulk WhatsApp messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.sendBulkMessages = async (req, res, next) => {
  try {
    const { accountId, recipients, message } = req.body;
    
    // Check if account exists
    const account = await AccountModel.findOne({
      where: { 
        id: accountId,
        platform: 'whatsapp',
        active: true
      }
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'WhatsApp account not found'
      });
    }
    
    // Check account status
    if (account.status !== 'connected') {
      return res.status(400).json({
        status: 'error',
        message: `WhatsApp account is not connected (status: ${account.status})`
      });
    }
    
    // Send messages
    const results = {
      total: recipients.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    // Create a queue to process messages with a delay to avoid rate limiting
    const queue = recipients.map(recipient => recipient.to);
    
    // Start a background job to send messages
    res.status(202).json({
      status: 'success',
      message: `Bulk message sending initiated for ${recipients.length} recipients`,
      data: {
        accountId,
        totalRecipients: recipients.length,
        jobId: Date.now().toString() // Simple job ID
      }
    });
    
    // Process queue after response
    const processQueue = async () => {
      for (const to of queue) {
        try {
          await whatsappService.sendMessage(accountId, to, message);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            to,
            error: error.message
          });
          logger.error(`Error sending WhatsApp message to ${to}:`, error);
        }
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      logger.info(`Bulk message sending completed: ${results.successful}/${results.total} successful`);
      
      // Emit event to websocket for real-time updates
      req.io?.emit('whatsapp:bulk-send:completed', {
        accountId,
        results
      });
    };
    
    // Start processing the queue
    processQueue();
  } catch (error) {
    logger.error('Error sending bulk WhatsApp messages:', error);
    next(error);
  }
};

/**
 * Get QR code for WhatsApp account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getQRCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if account exists
    const account = await AccountModel.findOne({
      where: { 
        id,
        platform: 'whatsapp',
        active: true
      }
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'WhatsApp account not found'
      });
    }
    
    // Return current status
    // Note: QR codes are provided via websocket events, not directly through the API
    res.status(200).json({
      status: 'success',
      message: 'QR code will be provided via WebSocket when available',
      data: {
        id: account.id,
        phoneNumber: account.phoneNumber,
        status: account.status,
        lastActivity: account.lastActivity
      }
    });
    
    // Force client to generate new QR code if client exists and not authenticated
    if (account.status !== 'connected') {
      const client = whatsappService.getClient(id);
      
      if (!client) {
        // Initialize client if it doesn't exist
        await whatsappService.initializeClient(id, account.phoneNumber);
      }
    }
  } catch (error) {
    logger.error(`Error getting QR code for WhatsApp account ${req.params.id}:`, error);
    next(error);
  }
};
