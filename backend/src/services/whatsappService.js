const { Client, LocalAuth, NoAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const logger = require('../utils/logger');
const { MessageModel, AccountModel, ConversationModel } = require('../models');
const fs = require('fs');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.clients = new Map(); // Map to store multiple WhatsApp client instances
    this.reconnectAttempts = new Map(); // Track reconnection attempts
    this.qrCodes = new Map(); // Cache QR codes
    this.qrExpiryTimers = new Map(); // Track QR code expiry timers
    this.sessionHealthChecks = new Map(); // Track session health check intervals
    this.MAX_RECONNECT_ATTEMPTS = 15; // Aumentado para maior tolerância
    this.HEALTH_CHECK_INTERVAL = 60000; // Check session health every minute
    this.SESSION_PATH = process.env.WHATSAPP_DATA_PATH || './whatsapp-sessions';
    this.io = null;
  }

  /**
   * Initialize the WhatsApp service
   * @param {SocketIO.Server} io - Socket.IO server instance
   */
  async initialize(io) {
    this.io = io;
    
    try {
      // Ensure session directory exists
      if (!fs.existsSync(this.SESSION_PATH)) {
        fs.mkdirSync(this.SESSION_PATH, { recursive: true });
      }
      
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
      // Check if there's already a client
      if (this.clients.has(accountId)) {
        logger.info(`Client already exists for account ${phoneNumber}, destroying old client`);
        await this.destroyClient(accountId);
      }
      
      // Create a new client instance with LocalAuth strategy for better session persistence
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: accountId,
          dataPath: this.SESSION_PATH
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
            '--single-process', // Improvement: better stability in containers
            '--disable-gpu'
          ],
          defaultViewport: null // Improvement: allow for automatic viewport sizing
        },
        qrMaxRetries: 5, // Increased from 3
        restartOnAuthFail: true,
        takeoverOnConflict: true, // Improvement: handle multi-device conflicts
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' // Improvement: more stable user agent
      });

      // Reset reconnect attempts counter
      this.reconnectAttempts.set(accountId, 0);

      // Handle QR code generation
      client.on('qr', async (qr) => {
        logger.info(`QR Code received for account ${phoneNumber}`);
        
        try {
          // Clear any previous QR expiry timer
          if (this.qrExpiryTimers.has(accountId)) {
            clearTimeout(this.qrExpiryTimers.get(accountId));
          }
          
          // Generate QR code as data URL
          const qrDataURL = await qrcode.toDataURL(qr);
          
          // Cache the QR code
          this.qrCodes.set(accountId, qrDataURL);
          
          // Set expiry timer for QR code (typically 60 seconds)
          const expiryTimer = setTimeout(() => {
            this.qrCodes.delete(accountId);
            this.io.emit('whatsapp:qr_expired', { accountId, phoneNumber });
          }, 60000);
          this.qrExpiryTimers.set(accountId, expiryTimer);
          
          // Emit the QR code to the frontend
          this.io.emit('whatsapp:qr', { 
            accountId, 
            phoneNumber, 
            qrCode: qrDataURL,
            expiresAt: Date.now() + 60000 // 60 seconds from now
          });
          
          // Update account status in database
          await AccountModel.update(
            { status: 'QR_READY', lastActivity: new Date() },
            { where: { id: accountId } }
          );
        } catch (error) {
          logger.error(`Error generating QR code for account ${accountId}:`, error);
        }
      });

      // Handle successful authentication
      client.on('authenticated', async () => {
        logger.info(`WhatsApp client authenticated for account ${phoneNumber}`);
        
        // Clear any QR expiry timer
        if (this.qrExpiryTimers.has(accountId)) {
          clearTimeout(this.qrExpiryTimers.get(accountId));
          this.qrExpiryTimers.delete(accountId);
        }
        
        // Clear cached QR code
        this.qrCodes.delete(accountId);
        
        // Update account status in database
        await AccountModel.update(
          { status: 'AUTHENTICATED', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('whatsapp:authenticated', { accountId, phoneNumber });
      });

      // Handle authentication failures
      client.on('auth_failure', async (error) => {
        logger.error(`Authentication failed for account ${phoneNumber}:`, error);
        
        // Update account status in database
        await AccountModel.update(
          { status: 'AUTH_FAILED', lastActivity: new Date() },
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
          { 
            status: 'CONNECTED', 
            lastActivity: new Date(),
            lastConnection: new Date() 
          },
          { where: { id: accountId } }
        );
        
        this.io.emit('whatsapp:ready', { accountId, phoneNumber });
        
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts.set(accountId, 0);
        
        // Start health check for this session
        this.startSessionHealthCheck(accountId, phoneNumber);
      });

      // Handle disconnection
      client.on('disconnected', async (reason) => {
        logger.warn(`WhatsApp client disconnected for account ${phoneNumber}: ${reason}`);
        
        // Update account status in database
        await AccountModel.update(
          { status: 'DISCONNECTED', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('whatsapp:disconnected', { accountId, phoneNumber, reason });
        
        // Stop health check
        this.stopSessionHealthCheck(accountId);
        
        // Handle client reconnection
        await this.handleReconnection(accountId, phoneNumber);
      });

      // Handle incoming messages
      client.on('message', async (msg) => {
        try {
          logger.info(`Message received for account ${phoneNumber} from ${msg.from}`);
          
          // Find or create conversation
          const conversation = await this.findOrCreateConversation(
            accountId,
            msg.from,
            msg.body,
            msg.timestamp ? new Date(msg.timestamp * 1000) : new Date()
          );
          
          // Save message to database
          const savedMessage = await MessageModel.create({
            accountId,
            conversationId: conversation?.id, // Link to conversation if exists
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
            message: savedMessage,
            conversation
          });
        } catch (error) {
          logger.error(`Error processing message for account ${phoneNumber}:`, error);
        }
      });
      
      // Handle connection state changes
      client.on('change_state', async (state) => {
        logger.info(`State changed for account ${phoneNumber}: ${state}`);
        
        // Update account status in database if state is significant
        if (['CONNECTED', 'OPENING', 'PAIRING', 'TIMEOUT'].includes(state)) {
          await AccountModel.update(
            { status: state, lastActivity: new Date() },
            { where: { id: accountId } }
          );
          
          this.io.emit('whatsapp:state_change', { accountId, phoneNumber, state });
        }
      });
      
      // Handle connection to phone event
      client.on('change_battery', async (batteryInfo) => {
        logger.info(`Battery info received for account ${phoneNumber}: Level ${batteryInfo.level}, Charging: ${batteryInfo.charging}`);
        
        this.io.emit('whatsapp:battery', { 
          accountId, 
          phoneNumber, 
          battery: batteryInfo 
        });
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
        { status: 'ERROR', lastActivity: new Date() },
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
   * Find or create a conversation for a WhatsApp message
   * @param {string} accountId - Account ID
   * @param {string} participantId - Participant ID (phone number)
   * @param {string} messageBody - Message body for preview
   * @param {Date} messageTimestamp - Message timestamp
   * @returns {Promise<Object>} - Conversation object
   */
  async findOrCreateConversation(accountId, participantId, messageBody, messageTimestamp) {
    try {
      // Check if we should exclude this participant (e.g., status broadcasts)
      if (participantId === 'status@broadcast') {
        logger.info(`Skipping conversation creation for status broadcast message`);
        return null;
      }
      
      // Find existing conversation or create new one
      const [conversation, created] = await ConversationModel.findOrCreate({
        where: {
          accountId,
          platform: 'whatsapp',
          participantId,
        },
        defaults: {
          name: participantId.split('@')[0], // Use phone number as name initially
          lastMessageAt: messageTimestamp,
          lastMessagePreview: messageBody?.substring(0, 100) || '(Media message)',
          unreadCount: 1,
          isGroup: participantId.includes('g.us'),
        }
      });
      
      // If conversation exists, update it
      if (!created) {
        await conversation.update({
          lastMessageAt: messageTimestamp,
          lastMessagePreview: messageBody?.substring(0, 100) || '(Media message)',
          unreadCount: conversation.unreadCount + 1,
        });
      }
      
      logger.info(`${created ? 'Created new' : 'Updated existing'} conversation for account ${accountId} with participant ${participantId}`);
      return conversation;
    } catch (error) {
      logger.error(`Error in findOrCreateConversation for account ${accountId}:`, error);
      return null;
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
          { status: 'RECONNECT_FAILED', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('whatsapp:reconnect_failed', { accountId, phoneNumber });
        return;
      }
      
      // Calculate backoff delay using exponential backoff formula with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, attempts), 300000); // max 5 minutes
      const jitter = Math.random() * 0.5 + 0.75; // 75% to 125% of baseDelay
      const delay = Math.floor(baseDelay * jitter);
      
      logger.info(`Attempting to reconnect WhatsApp client for account ${phoneNumber} in ${delay}ms (attempt ${attempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
      
      // Update reconnect attempts counter
      this.reconnectAttempts.set(accountId, attempts + 1);
      
      // Update account status in database
      await AccountModel.update(
        { status: 'RECONNECTING', lastActivity: new Date() },
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
      await this.destroyClient(accountId);
      
      // Reinitialize the client
      await this.initializeClient(accountId, phoneNumber);
    } catch (error) {
      logger.error(`Error during reconnection for account ${phoneNumber}:`, error);
    }
  }
  
  /**
   * Safely destroy a client
   * @param {string} accountId - Account ID
   */
  async destroyClient(accountId) {
    if (this.clients.has(accountId)) {
      const client = this.clients.get(accountId);
      try {
        // Stop health check
        this.stopSessionHealthCheck(accountId);
        
        // Clear QR expiry timer
        if (this.qrExpiryTimers.has(accountId)) {
          clearTimeout(this.qrExpiryTimers.get(accountId));
          this.qrExpiryTimers.delete(accountId);
        }
        
        // Destroy client
        await client.destroy();
        logger.info(`Destroyed WhatsApp client for account ${accountId}`);
      } catch (error) {
        logger.error(`Error destroying WhatsApp client for account ${accountId}:`, error);
      }
      this.clients.delete(accountId);
    }
  }
  
  /**
   * Start session health check for an account
   * @param {string} accountId - Account ID
   * @param {string} phoneNumber - Phone number for reference
   */
  startSessionHealthCheck(accountId, phoneNumber) {
    // Clear any existing health check
    this.stopSessionHealthCheck(accountId);
    
    // Start new health check interval
    const interval = setInterval(async () => {
      try {
        const client = this.getClient(accountId);
        if (!client) {
          logger.warn(`Health check failed: No client found for account ${phoneNumber}`);
          this.stopSessionHealthCheck(accountId);
          return;
        }
        
        // Check if client is properly connected
        const isConnected = client.info && 
                           client.info.wid && 
                           typeof client.info.wid._serialized === 'string';
        
        if (!isConnected) {
          logger.warn(`Health check failed: Client not properly connected for account ${phoneNumber}`);
          await this.handleReconnection(accountId, phoneNumber);
          return;
        }
        
        // Update last activity timestamp
        await AccountModel.update(
          { lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        logger.debug(`Health check passed for account ${phoneNumber}`);
      } catch (error) {
        logger.error(`Error during health check for account ${phoneNumber}:`, error);
        await this.handleReconnection(accountId, phoneNumber);
      }
    }, this.HEALTH_CHECK_INTERVAL);
    
    // Store the interval reference
    this.sessionHealthChecks.set(accountId, interval);
    logger.info(`Started health check for account ${phoneNumber}`);
  }
  
  /**
   * Stop session health check for an account
   * @param {string} accountId - Account ID
   */
  stopSessionHealthCheck(accountId) {
    if (this.sessionHealthChecks.has(accountId)) {
      clearInterval(this.sessionHealthChecks.get(accountId));
      this.sessionHealthChecks.delete(accountId);
      logger.info(`Stopped health check for account ${accountId}`);
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
   * Get cached QR code for an account
   * @param {string} accountId - Account ID
   * @returns {string|null} QR code data URL or null if not available
   */
  getCachedQRCode(accountId) {
    return this.qrCodes.get(accountId) || null;
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
      
      // Find or create conversation
      const conversation = await this.findOrCreateConversation(
        accountId,
        formattedNumber,
        message,
        new Date()
      );
      
      // Save sent message to database
      const savedMessage = await MessageModel.create({
        accountId,
        conversationId: conversation?.id,
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
        message: savedMessage,
        conversation
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
