const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define('conversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    platform: {
      type: DataTypes.ENUM('whatsapp', 'instagram'),
      allowNull: false
    },
    participantId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'ID/phone number of the conversation participant'
    },
    threadId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Thread ID for Instagram conversations'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Name of the conversation, usually the contact name'
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastMessagePreview: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isGroup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'conversations',
    timestamps: true
  });

  return Conversation;
};
