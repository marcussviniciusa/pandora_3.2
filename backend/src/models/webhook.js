module.exports = (sequelize, DataTypes) => {
  const Webhook = sequelize.define('webhook', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    events: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    accountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      },
      comment: 'If null, webhook applies to all accounts'
    },
    platform: {
      type: DataTypes.ENUM('whatsapp', 'instagram', 'all'),
      defaultValue: 'all'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Secret key for webhook verification'
    },
    headers: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    lastTrigger: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastStatus: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lastResponse: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    failCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'webhooks',
    timestamps: true,
    indexes: [
      {
        fields: ['isActive']
      },
      {
        fields: ['accountId']
      },
      {
        fields: ['platform']
      }
    ]
  });

  return Webhook;
};
