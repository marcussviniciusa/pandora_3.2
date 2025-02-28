const { IgApiClient } = require('instagram-private-api');
const logger = require('../utils/logger');
const { MessageModel, AccountModel } = require('../models');

class InstagramService {
  constructor() {
    this.clients = new Map(); // Map to store multiple Instagram client instances
    this.reconnectAttempts = new Map(); // Track reconnection attempts
    this.MAX_RECONNECT_ATTEMPTS = 10;
    this.io = null;
    this.messagePollingIntervals = new Map(); // Map to store message polling intervals
    this.POLLING_INTERVAL = 30000; // Poll for new messages every 30 seconds
  }

  /**
   * Initialize the Instagram service
   * @param {SocketIO.Server} io - Socket.IO server instance
   */
  async initialize(io) {
    this.io = io;
    
    try {
      // Load all Instagram accounts from database
      const accounts = await AccountModel.findAll({ 
        where: { platform: 'instagram', active: true } 
      });
      
      // Initialize a client for each account
      for (const account of accounts) {
        await this.initializeClient(account.id, account.username, account.password);
      }
      
      logger.info('Instagram service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Instagram service:', error);
      throw error;
    }
  }

  /**
   * Initialize a new Instagram client
   * @param {string} accountId - Account ID
   * @param {string} username - Instagram username
   * @param {string} password - Instagram password
   */
  async initializeClient(accountId, username, password) {
    try {
      // Create a new client instance
      const ig = new IgApiClient();
      ig.state.generateDevice(username);
      
      // Reset reconnect attempts counter
      this.reconnectAttempts.set(accountId, 0);
      
      // Update account status in database
      await AccountModel.update(
        { status: 'initializing', lastActivity: new Date() },
        { where: { id: accountId } }
      );
      
      this.io.emit('instagram:initializing', { accountId, username });
      
      // Attempt to login
      await ig.simulate.preLoginFlow();
      const loggedInUser = await ig.account.login(username, password);
      
      // Process post-login flow
      await ig.simulate.postLoginFlow();
      
      // Store the client instance
      this.clients.set(accountId, ig);
      
      // Update account status in database
      await AccountModel.update(
        { status: 'connected', lastActivity: new Date() },
        { where: { id: accountId } }
      );
      
      this.io.emit('instagram:connected', { 
        accountId, 
        username, 
        userId: loggedInUser.pk 
      });
      
      logger.info(`Instagram client authenticated for account ${username}`);
      
      // Start polling for new messages
      this.startMessagePolling(accountId, username);
      
      return ig;
    } catch (error) {
      logger.error(`Error initializing Instagram client for account ${username}:`, error);
      
      // Check if the error is a challenge
      if (error.name === 'IgCheckpointError' || error.name === 'IgLoginTwoFactorRequiredError') {
        // Update account status in database
        await AccountModel.update(
          { status: 'challenge_required', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('instagram:challenge_required', { 
          accountId, 
          username, 
          error: error.message 
        });
      } else {
        // Update account status in database
        await AccountModel.update(
          { status: 'auth_failed', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('instagram:auth_failure', { 
          accountId, 
          username, 
          error: error.message 
        });
        
        // Try to reconnect
        await this.handleReconnection(accountId, username, password);
      }
      
      throw error;
    }
  }

  /**
   * Handle client reconnection with exponential backoff
   * @param {string} accountId - Account ID
   * @param {string} username - Instagram username
   * @param {string} password - Instagram password
   */
  async handleReconnection(accountId, username, password) {
    try {
      // Get current reconnect attempts
      const attempts = this.reconnectAttempts.get(accountId) || 0;
      
      // Check if we've exceeded the maximum reconnection attempts
      if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
        logger.error(`Max reconnection attempts reached for account ${username}`);
        
        await AccountModel.update(
          { status: 'reconnect_failed', lastActivity: new Date() },
          { where: { id: accountId } }
        );
        
        this.io.emit('instagram:reconnect_failed', { accountId, username });
        return;
      }
      
      // Calculate backoff delay using exponential backoff formula
      const delay = Math.min(1000 * Math.pow(2, attempts), 300000); // max 5 minutes
      
      logger.info(`Attempting to reconnect Instagram client for account ${username} in ${delay}ms (attempt ${attempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
      
      // Update reconnect attempts counter
      this.reconnectAttempts.set(accountId, attempts + 1);
      
      // Update account status in database
      await AccountModel.update(
        { status: 'reconnecting', lastActivity: new Date() },
        { where: { id: accountId } }
      );
      
      this.io.emit('instagram:reconnecting', { 
        accountId, 
        username, 
        attempt: attempts + 1, 
        maxAttempts: this.MAX_RECONNECT_ATTEMPTS 
      });
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Remove old client if it exists
      if (this.clients.has(accountId)) {
        this.clients.delete(accountId);
      }
      
      // Stop message polling if it exists
      this.stopMessagePolling(accountId);
      
      // Reinitialize the client
      await this.initializeClient(accountId, username, password);
    } catch (error) {
      logger.error(`Error during reconnection for account ${username}:`, error);
    }
  }

  /**
   * Start polling for new Instagram direct messages
   * @param {string} accountId - Account ID
   * @param {string} username - Instagram username
   */
  startMessagePolling(accountId, username) {
    // Clear any existing interval
    this.stopMessagePolling(accountId);
    
    // Set up polling interval
    const intervalId = setInterval(async () => {
      try {
        await this.fetchNewMessages(accountId, username);
      } catch (error) {
        logger.error(`Error polling for Instagram messages for account ${username}:`, error);
        
        // Check if the error indicates session expiration
        if (error.name === 'IgResponseError' && 
           (error.message.includes('login_required') || error.message.includes('challenge_required'))) {
          logger.warn(`Instagram session expired for account ${username}, attempting to reconnect`);
          
          // Update account status
          await AccountModel.update(
            { status: 'session_expired', lastActivity: new Date() },
            { where: { id: accountId } }
          );
          
          this.io.emit('instagram:session_expired', { accountId, username });
          
          // Get account details to retrieve password
          const account = await AccountModel.findByPk(accountId);
          
          if (account && account.password) {
            // Stop polling and attempt reconnection
            this.stopMessagePolling(accountId);
            await this.handleReconnection(accountId, username, account.password);
          }
        }
      }
    }, this.POLLING_INTERVAL);
    
    // Store the interval ID
    this.messagePollingIntervals.set(accountId, intervalId);
    
    logger.info(`Started Instagram message polling for account ${username}`);
  }

  /**
   * Stop polling for Instagram direct messages
   * @param {string} accountId - Account ID
   */
  stopMessagePolling(accountId) {
    if (this.messagePollingIntervals.has(accountId)) {
      clearInterval(this.messagePollingIntervals.get(accountId));
      this.messagePollingIntervals.delete(accountId);
    }
  }

  /**
   * Fetch new Instagram direct messages
   * @param {string} accountId - Account ID
   * @param {string} username - Instagram username
   */
  async fetchNewMessages(accountId, username) {
    try {
      const ig = this.getClient(accountId);
      
      if (!ig) {
        logger.warn(`No Instagram client found for account ${username}`);
        return;
      }
      
      // Fetch inbox
      const inbox = await ig.direct.inbox();
      const threads = inbox.threads;
      
      // Get account details
      const account = await AccountModel.findByPk(accountId);
      
      // Process each thread
      for (const thread of threads) {
        // Process only threads with new items
        if (thread.has_newer) {
          // Fetch full thread
          const fullThread = await ig.direct.getThread(thread.thread_id);
          
          // Process new messages
          for (const item of fullThread.items) {
            // Check if message already exists in database
            const existingMessage = await MessageModel.findOne({
              where: {
                platform: 'instagram',
                messageId: item.item_id
              }
            });
            
            // Skip if message already exists
            if (existingMessage) {
              continue;
            }
            
            // Save message to database
            const savedMessage = await MessageModel.create({
              accountId,
              platform: 'instagram',
              messageId: item.item_id,
              from: item.user_id.toString(),
              to: account.userId,
              body: item.text || '',
              type: item.item_type,
              timestamp: new Date(item.timestamp / 1000),
              isFromMe: item.user_id.toString() === account.userId,
              isRead: false,
              threadId: thread.thread_id,
              raw: JSON.stringify(item)
            });
            
            // Emit message to frontend
            this.io.emit('instagram:message', {
              accountId,
              username,
              message: savedMessage,
              thread: {
                id: thread.thread_id,
                title: thread.thread_title,
                users: thread.users.map(u => ({
                  id: u.pk,
                  username: u.username,
                  fullName: u.full_name,
                  profilePic: u.profile_pic_url
                }))
              }
            });
          }
        }
      }
    } catch (error) {
      logger.error(`Error fetching Instagram messages for account ${username}:`, error);
      throw error;
    }
  }

  /**
   * Get a client instance by account ID
   * @param {string} accountId - Account ID
   * @returns {IgApiClient|null} Instagram client instance or null if not found
   */
  getClient(accountId) {
    return this.clients.get(accountId) || null;
  }

  /**
   * Send a direct message to a user or thread
   * @param {string} accountId - Account ID
   * @param {string} threadId - Thread ID (optional, use recipientId if not provided)
   * @param {string} recipientId - Recipient user ID (optional, use threadId if not provided)
   * @param {string} message - Message content
   * @returns {Promise<object>} Sent message details
   */
  async sendMessage(accountId, threadId, recipientId, message) {
    try {
      const ig = this.getClient(accountId);
      
      if (!ig) {
        throw new Error(`No Instagram client found for account ${accountId}`);
      }
      
      let thread;
      let messageResponse;
      
      // Send to existing thread or create new thread
      if (threadId) {
        thread = { thread_id: threadId };
        messageResponse = await ig.direct.sendText(threadId, message);
      } else if (recipientId) {
        messageResponse = await ig.direct.sendText([recipientId], message);
        // Extract thread info from response
        thread = { thread_id: messageResponse.thread_id };
      } else {
        throw new Error('Either threadId or recipientId must be provided');
      }
      
      // Get the sent message (typically the last item)
      const item = messageResponse.items[0];
      
      // Get account details
      const account = await AccountModel.findByPk(accountId);
      
      // Save sent message to database
      const savedMessage = await MessageModel.create({
        accountId,
        platform: 'instagram',
        messageId: item.item_id,
        from: account.userId,
        to: threadId || recipientId,
        body: message,
        type: item.item_type,
        timestamp: new Date(item.timestamp / 1000),
        isFromMe: true,
        isRead: true,
        threadId: thread.thread_id,
        raw: JSON.stringify(item)
      });
      
      // Emit message to frontend
      this.io.emit('instagram:message:sent', {
        accountId,
        username: account.username,
        message: savedMessage
      });
      
      return savedMessage;
    } catch (error) {
      logger.error(`Error sending Instagram message for account ${accountId}:`, error);
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
      const ig = this.getClient(accountId);
      
      if (!ig) {
        return 'disconnected';
      }
      
      const account = await AccountModel.findByPk(accountId);
      return account?.status || 'unknown';
    } catch (error) {
      logger.error(`Error getting Instagram status for account ${accountId}:`, error);
      return 'error';
    }
  }

  /**
   * Create a new Instagram account
   * @param {string} username - Instagram username
   * @param {string} password - Instagram password
   * @returns {Promise<object>} Created account details
   */
  async createAccount(username, password) {
    try {
      // Create account in database (encrypt password in a real application)
      const account = await AccountModel.create({
        username,
        password,
        platform: 'instagram',
        status: 'initializing',
        active: true,
        lastActivity: new Date()
      });
      
      // Initialize client for the new account
      const ig = await this.initializeClient(account.id, username, password);
      
      // Update account with user ID
      await AccountModel.update(
        { userId: ig.state.cookieUserId },
        { where: { id: account.id } }
      );
      
      return account;
    } catch (error) {
      logger.error(`Error creating Instagram account for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Logout and remove an Instagram account
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} Success status
   */
  async removeAccount(accountId) {
    try {
      const ig = this.getClient(accountId);
      
      if (ig) {
        // Logout the client
        await ig.account.logout();
        // Remove from clients map
        this.clients.delete(accountId);
      }
      
      // Stop message polling
      this.stopMessagePolling(accountId);
      
      // Update account status in database
      await AccountModel.update(
        { status: 'removed', active: false, lastActivity: new Date() },
        { where: { id: accountId } }
      );
      
      return true;
    } catch (error) {
      logger.error(`Error removing Instagram account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active Instagram accounts
   * @returns {Promise<Array>} List of active accounts
   */
  async getAccounts() {
    try {
      return await AccountModel.findAll({
        where: { platform: 'instagram', active: true }
      });
    } catch (error) {
      logger.error('Error getting Instagram accounts:', error);
      throw error;
    }
  }
}

// Singleton instance
const instagramService = new InstagramService();

module.exports = instagramService;
