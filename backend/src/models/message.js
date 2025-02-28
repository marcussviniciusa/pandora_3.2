module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('message', {
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
    conversationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'conversations',
        key: 'id'
      }
    },
    platform: {
      type: DataTypes.ENUM('whatsapp', 'instagram'),
      allowNull: false
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Platform-specific message ID'
    },
    from: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Sender ID/phone number'
    },
    to: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Recipient ID/phone number'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Message content'
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'chat',
      comment: 'Message type (e.g., chat, image, video)'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isFromMe: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    threadId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Thread ID for Instagram messages'
    },
    raw: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Original message data from platform'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      {
        fields: ['accountId']
      },
      {
        fields: ['conversationId']
      },
      {
        fields: ['platform', 'messageId'],
        unique: true
      },
      {
        fields: ['from', 'to']
      },
      {
        fields: ['timestamp']
      }
    ]
  });

  return Message;
};
