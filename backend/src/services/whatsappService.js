const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const logger = require('../utils/logger');
const { MessageModel, AccountModel } = require('../models');

class WhatsAppService {
  constructor() {
    this.clients = new Map(); // Map to store multiple WhatsApp client instances
    this.reconnectAttempts = new Map(); // Track reconnection attempts
    this.MAX_RECONNECT_ATTEMPTS = 10;
    this.io = null;
  }

  /**
   * Initialize the WhatsApp service
   * @param {SocketIO.Server} io - Socket.IO server instance
   */
  async initialize(io) {
    this.io = io;
    
    try {
      // Load all WhatsApp accounts from database
      const accounts = await AccountModel.findAll({ 
        where: { platform: 'whatsapp', active: true } 
      });
      
      // Initialize a client for each account
      for (const account of accounts) {
        await this.initializeClient(account.id, account.phoneNumber);
      }
      
      logger.info('WhatsApp service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp service:', error);
      throw error;
    }
  }

  /**
   * Initialize a new WhatsApp client
   * @param {string} accountId - Account ID
   * @param {string} phoneNumber - Phone number for reference
   */
  async initializeClient(accountId, phoneNumber) {
    try {
      // Create a new client instance with LocalAuth strategy for better session persistence
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: accountId,
          dataPath: process.env.WHATSAPP_DATA_PATH || './whatsapp-sessions'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        },
        qrMaxRetries: 3,
        restartOnAuthFail: true
      });

      // Reset reconnect attempts counter
      this.reconnectAttempts.set(accountId, 0);

      // Handle QR code generation
      client.on('qr', async (qr) => {
        logger.info(`QR Code received for account ${phoneNumber}`);
        
        try {
          // Generate QR code as data URL
          const qrDataURL = await qrcode.toDataURL(qr);
          
          // Emit the QR code to the frontend
          this.io.emit('whatsapp:qr', { accountId, phoneNumber, qrCode: qrDataURL });
          
          // Update account status in database
          await AccountModel.update(
            { status: 'qr_ready', lastActivity: new Date() },
            { where: { id: accountId } }
          );
        } catch (error) {
          logger.error(`Error generating QR code for account ${accountId}:`, error);
        }
      });

      // Handle successful authentication
      client.on('authenticated', async () => {
        logger.info(`WhatsApp client authenticated for account ${phoneNumber}`);
        
        // Update account status in database
        await AccountModel.update(
          { status: 'authenticated', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('whatsapp:authenticated', { accountId, phoneNumber });
      });

      // Handle authentication failures
      client.on('auth_failure', async (error) => {
        logger.error(`Authentication failed for account ${phoneNumber}:`, error);
        
        // Update account status in database
        await AccountModel.update(
          { status: 'auth_failed', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('whatsapp:auth_failure', { accountId, phoneNumber, error: error.message });
        
        // Try to reinitialize the client with exponential backoff
        await this.handleReconnection(accountId, phoneNumber);
      });

      // Handle client ready state
      client.on('ready', async () => {
        logger.info(`WhatsApp client ready for account ${phoneNumber}`);
        
        // Update account status in database
        await AccountModel.update(
          { status: 'connected', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('whatsapp:ready', { accountId, phoneNumber });
        
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts.set(accountId, 0);
      });

      // Handle disconnection
      client.on('disconnected', async (reason) => {
        logger.warn(`WhatsApp client disconnected for account ${phoneNumber}: ${reason}`);
        
        // Update account status in database
        await AccountModel.update(
          { status: 'disconnected', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('whatsapp:disconnected', { accountId, phoneNumber, reason });
        
        // Handle client reconnection
        await this.handleReconnection(accountId, phoneNumber);
      });

      // Handle incoming messages
      client.on('message', async (msg) => {
        try {
          logger.info(`Message received for account ${phoneNumber} from ${msg.from}`);
          
          // Save message to database
          const savedMessage = await MessageModel.create({
            accountId,
            platform: 'whatsapp',
            messageId: msg.id.id,
            from: msg.from,
            to: msg.to || client.info.wid._serialized,
            body: msg.body,
            type: msg.type,
            timestamp: msg.timestamp ? new Date(msg.timestamp * 1000) : new Date(),
            isFromMe: msg.fromMe,
            isRead: false,
            raw: JSON.stringify(msg)
          });
          
          // Emit message to frontend
          this.io.emit('whatsapp:message', {
            accountId,
            phoneNumber,
            message: savedMessage
          });
          
          // Send webhook notification if configured
          // TODO: Implement webhook notifications
        } catch (error) {
          logger.error(`Error processing message for account ${phoneNumber}:`, error);
        }
      });

      // Initialize the client
      await client.initialize();
      
      // Store the client instance
      this.clients.set(accountId, client);
      
      logger.info(`WhatsApp client initialized for account ${phoneNumber}`);
    } catch (error) {
      logger.error(`Error initializing WhatsApp client for account ${phoneNumber}:`, error);
      
      // Update account status in database
      await AccountModel.update(
        { status: 'error', lastActivity: new Date() },
        { where: { id: accountId } }
      );
      
      this.io.emit('whatsapp:error', { 
        accountId, 
        phoneNumber, 
        error: error.message 
      });
      
      // Try to reconnect
      await this.handleReconnection(accountId, phoneNumber);
    }
  }

  /**
   * Handle client reconnection with exponential backoff
   * @param {string} accountId - Account ID
   * @param {string} phoneNumber - Phone number for reference
   */
  async handleReconnection(accountId, phoneNumber) {
    try {
      // Get current reconnect attempts
      const attempts = this.reconnectAttempts.get(accountId) || 0;
      
      // Check if we've exceeded the maximum reconnection attempts
      if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
        logger.error(`Max reconnection attempts reached for account ${phoneNumber}`);
        
        await AccountModel.update(
          { status: 'reconnect_failed', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('whatsapp:reconnect_failed', { accountId, phoneNumber });
        return;
      }
      
      // Calculate backoff delay using exponential backoff formula
      const delay = Math.min(1000 * Math.pow(2, attempts), 300000); // max 5 minutes
      
      logger.info(`Attempting to reconnect WhatsApp client for account ${phoneNumber} in ${delay}ms (attempt ${attempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
      
      // Update reconnect attempts counter
      this.reconnectAttempts.set(accountId, attempts + 1);
      
      // Update account status in database
      await AccountModel.update(
        { status: 'reconnecting', lastActivity: new Date() },
        { where: { id: accountId } }
      );
      
      this.io.emit('whatsapp:reconnecting', { 
        accountId, 
        phoneNumber, 
        attempt: attempts + 1, 
        maxAttempts: this.MAX_RECONNECT_ATTEMPTS 
      });
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Destroy old client if it exists
      if (this.clients.has(accountId)) {
        const oldClient = this.clients.get(accountId);
        try {
          await oldClient.destroy();
        } catch (error) {
          logger.error(`Error destroying old WhatsApp client for account ${phoneNumber}:`, error);
        }
        this.clients.delete(accountId);
      }
      
      // Reinitialize the client
      await this.initializeClient(accountId, phoneNumber);
    } catch (error) {
      logger.error(`Error during reconnection for account ${phoneNumber}:`, error);
    }
  }

  /**
   * Get a client instance by account ID
   * @param {string} accountId - Account ID
   * @returns {Client|null} WhatsApp client instance or null if not found
   */
  getClient(accountId) {
    return this.clients.get(accountId) || null;
  }

  /**
   * Send a message using the specified client
   * @param {string} accountId - Account ID
   * @param {string} to - Recipient phone number with country code
   * @param {string} message - Message content
   * @returns {Promise<object>} Sent message details
   */
  async sendMessage(accountId, to, message) {
    try {
      const client = this.getClient(accountId);
      
      if (!client) {
        throw new Error(`No WhatsApp client found for account ${accountId}`);
      }
      
      // Format the number for WhatsApp
      const formattedNumber = to.includes('@c.us') ? to : `${to}@c.us`;
      
      // Send the message
      const msg = await client.sendMessage(formattedNumber, message);
      
      // Save sent message to database
      const savedMessage = await MessageModel.create({
        accountId,
        platform: 'whatsapp',
        messageId: msg.id.id,
        from: client.info.wid._serialized,
        to: formattedNumber,
        body: message,
        type: 'chat',
        timestamp: new Date(),
        isFromMe: true,
        isRead: true,
        raw: JSON.stringify(msg)
      });
      
      // Get account details
      const account = await AccountModel.findByPk(accountId);
      
      // Emit message to frontend
      this.io.emit('whatsapp:message:sent', {
        accountId,
        phoneNumber: account?.phoneNumber,
        message: savedMessage
      });
      
      return savedMessage;
    } catch (error) {
      logger.error(`Error sending WhatsApp message for account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Get the connection status for a client
   * @param {string} accountId - Account ID
   * @returns {Promise<string>} Connection status
   */
  async getStatus(accountId) {
    try {
      const client = this.getClient(accountId);
      
      if (!client) {
        return 'disconnected';
      }
      
      const account = await AccountModel.findByPk(accountId);
      return account?.status || 'unknown';
    } catch (error) {
      logger.error(`Error getting WhatsApp status for account ${accountId}:`, error);
      return 'error';
    }
  }

  /**
   * Create a new WhatsApp account
   * @param {string} phoneNumber - Phone number with country code
   * @returns {Promise<object>} Created account details
   */
  async createAccount(phoneNumber) {
    try {
      // Create account in database
      const account = await AccountModel.create({
        phoneNumber,
        platform: 'whatsapp',
        status: 'initializing',
        active: true,
        lastActivity: new Date()
      });
      
      // Initialize client for the new account
      await this.initializeClient(account.id, phoneNumber);
      
      return account;
    } catch (error) {
      logger.error(`Error creating WhatsApp account for ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Logout and remove a WhatsApp account
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} Success status
   */
  async removeAccount(accountId) {
    try {
      const client = this.getClient(accountId);
      
      if (client) {
        // Logout the client
        await client.logout();
        // Destroy the client
        await client.destroy();
        // Remove from clients map
        this.clients.delete(accountId);
      }
      
      // Update account status in database
      await AccountModel.update(
        { status: 'removed', active: false, lastActivity: new Date() },
        { where: { id: accountId } }
      );
      
      return true;
    } catch (error) {
      logger.error(`Error removing WhatsApp account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active WhatsApp accounts
   * @returns {Promise<Array>} List of active accounts
   */
  async getAccounts() {
    try {
      return await AccountModel.findAll({
        where: { platform: 'whatsapp', active: true }
      });
    } catch (error) {
      logger.error('Error getting WhatsApp accounts:', error);
      throw error;
    }
  }
}

// Singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
