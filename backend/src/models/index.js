const Sequelize = require('sequelize');
const logger = require('../utils/logger');

// Load environment variables
const dbConfig = {
  host: process.env.DB_HOST || '77.37.41.106',
  database: process.env.DB_NAME || 'pandora_3.2',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Marcus1911!!Marcus',
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  }
};

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define
  }
);

// Import models
const AccountModel = require('./account')(sequelize, Sequelize);
const MessageModel = require('./message')(sequelize, Sequelize);
const ConversationModel = require('./conversation')(sequelize, Sequelize);
const ContactModel = require('./contact')(sequelize, Sequelize);
const WebhookModel = require('./webhook')(sequelize, Sequelize);
const UserModel = require('./user')(sequelize, Sequelize);

// Define relationships
AccountModel.hasMany(MessageModel, { foreignKey: 'accountId', as: 'messages' });
MessageModel.belongsTo(AccountModel, { foreignKey: 'accountId', as: 'account' });

AccountModel.hasMany(ConversationModel, { foreignKey: 'accountId', as: 'conversations' });
ConversationModel.belongsTo(AccountModel, { foreignKey: 'accountId', as: 'account' });

ConversationModel.hasMany(MessageModel, { foreignKey: 'conversationId', as: 'messages' });
MessageModel.belongsTo(ConversationModel, { foreignKey: 'conversationId', as: 'conversation' });

AccountModel.hasMany(ContactModel, { foreignKey: 'accountId', as: 'contacts' });
ContactModel.belongsTo(AccountModel, { foreignKey: 'accountId', as: 'account' });

// Export models and Sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  AccountModel,
  MessageModel,
  ConversationModel,
  ContactModel,
  WebhookModel,
  UserModel
};
