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
    const { phoneNumber, name } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required'
      });
    }
    
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
        message: 'A WhatsApp account with this phone number already exists'
      });
    }
    
    // Create account
    const account = await AccountModel.create({
      platform: 'whatsapp',
      phoneNumber,
      name: name || `WhatsApp ${phoneNumber}`,
      status: 'INITIALIZING',
      active: true,
      lastActivity: new Date()
    });
    
    // Initialize WhatsApp client for this account
    setTimeout(() => {
      whatsappService.initializeClient(account.id, account.phoneNumber)
        .catch(err => logger.error(`Failed to initialize client for new account ${account.id}:`, err));
    }, 100); // Small delay to allow response to be sent first
    
    res.status(201).json({
      status: 'success',
      message: 'WhatsApp account created successfully',
      data: account
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
        platform: 'whatsapp',
        active: true
      },
      attributes: { exclude: ['password'] }
    });
    
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'WhatsApp account not found'
      });
    }
    
    // Get client instance if available
    const client = whatsappService.getClient(id);
    let connectionInfo = null;
    
    if (client && client.info) {
      connectionInfo = {
        connected: client.info && client.info.wid ? true : false,
        phone: client.info.phone || account.phoneNumber,
        name: client.info.pushname || account.name,
        platform: client.info.platform || 'unknown'
      };
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        ...account.dataValues,
        connectionInfo
      }
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
    
    // Destroy WhatsApp client if it exists
    if (whatsappService.getClient(id)) {
      await whatsappService.destroyClient(id);
    }
    
    // Soft delete the account (mark as inactive)
    await AccountModel.update(
      { 
        active: false,
        status: 'REMOVED',
        lastActivity: new Date()
      },
      { where: { id } }
    );
    
    // Delete session data if exists
    whatsappService.deleteSessionData(id);
    
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
    
    // Default status info
    let statusInfo = {
      accountId: id,
      phoneNumber: account.phoneNumber,
      status: account.status,
      lastActivity: account.lastActivity,
      connected: false,
      authStatus: 'unknown',
      reconnectAttempts: whatsappService.reconnectAttempts.get(id) || 0,
      qrAvailable: whatsappService.getCachedQRCode(id) ? true : false
    };
    
    // Enhance with client info if available
    if (client) {
      try {
        statusInfo.connected = client.info && client.info.wid ? true : false;
        
        // Add device info if available
        if (client.info) {
          statusInfo.deviceInfo = {
            platform: client.info.platform || 'unknown',
            phone: client.info.phone || account.phoneNumber,
            wid: client.info.wid ? client.info.wid._serialized : null,
          };
        }
        
        // Get battery info if available and connected
        if (statusInfo.connected && client.getBatteryStatus) {
          try {
            const battery = await client.getBatteryStatus();
            statusInfo.battery = battery;
          } catch (batteryError) {
            logger.debug(`Could not get battery info for account ${id}:`, batteryError);
          }
        }
        
        // Get connection state
        statusInfo.authStatus = client.authStrategy.state;
      } catch (clientError) {
        logger.error(`Error getting client info for account ${id}:`, clientError);
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: statusInfo
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
    
    // Force state update
    await AccountModel.update(
      { 
        status: 'RECONNECTING',
        lastActivity: new Date()
      },
      { where: { id } }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Reconnection initiated',
      data: {
        accountId: id,
        phoneNumber: account.phoneNumber,
        status: 'RECONNECTING'
      }
    });
    
    // Perform reconnection after response sent
    try {
      // Reset reconnect attempts to allow full retry cycle
      whatsappService.reconnectAttempts.set(id, 0);
      
      // Destroy any existing client
      await whatsappService.destroyClient(id);
      
      // Initialize a new client
      await whatsappService.initializeClient(id, account.phoneNumber);
      
      logger.info(`Reconnection initiated for WhatsApp account ${id}`);
    } catch (error) {
      logger.error(`Error during forced reconnection for account ${id}:`, error);
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
    
    // Check if we have a cached QR code
    const cachedQR = whatsappService.getCachedQRCode(id);
    
    if (cachedQR) {
      return res.status(200).json({
        status: 'success',
        message: 'QR code available',
        data: {
          accountId: id,
          phoneNumber: account.phoneNumber,
          qrCode: cachedQR,
          status: 'QR_READY',
          expiresAt: Date.now() + 55000 // Approximate time remaining
        }
      });
    }
    
    // If no QR available and account is already connected, return error
    if (account.status === 'CONNECTED') {
      return res.status(400).json({
        status: 'error',
        message: 'Account already connected, QR code not needed',
        data: {
          accountId: id,
          phoneNumber: account.phoneNumber,
          status: account.status
        }
      });
    }
    
    // Update status to indicate QR is being generated
    await AccountModel.update(
      { 
        status: 'INITIALIZING',
        lastActivity: new Date()
      },
      { where: { id } }
    );
    
    // Respond with current status
    res.status(202).json({
      status: 'success',
      message: 'QR code generation initiated',
      data: {
        accountId: id,
        phoneNumber: account.phoneNumber,
        status: 'INITIALIZING',
        qrAvailable: false,
        // Important: Client should listen for WebSocket events to get the QR code
        waitForWebSocket: true
      }
    });
    
    // Initialize or reinitialize the client to generate new QR code
    setTimeout(async () => {
      try {
        // Reset reconnect attempts
        whatsappService.reconnectAttempts.set(id, 0);
        
        // Destroy existing client if any
        await whatsappService.destroyClient(id);
        
        // Initialize a new client
        await whatsappService.initializeClient(id, account.phoneNumber);
        
        logger.info(`QR code generation initiated for WhatsApp account ${id}`);
      } catch (error) {
        logger.error(`Error initiating QR code generation for account ${id}:`, error);
        
        // Update status to indicate error
        await AccountModel.update(
          { 
            status: 'ERROR',
            lastActivity: new Date()
          },
          { where: { id } }
        );
      }
    }, 100); // Small delay to allow response to be sent first
  } catch (error) {
    logger.error(`Error getting QR code for WhatsApp account ${req.params.id}:`, error);
    next(error);
  }
};
