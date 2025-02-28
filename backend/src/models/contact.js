module.exports = (sequelize, DataTypes) => {
  const Contact = sequelize.define('contact', {
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
    contactId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Platform-specific contact ID (phone number or username)'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profilePicUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isBusiness: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isGroup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'contacts',
    timestamps: true
  });

  return Contact;
};
