const Sequelize = require('sequelize');
const { Op } = Sequelize;

module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define('account', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    platform: {
      type: DataTypes.ENUM('whatsapp', 'instagram'),
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Phone number for WhatsApp accounts'
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Username for Instagram accounts'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Password for Instagram accounts (should be encrypted in production)'
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Platform-specific user ID'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'disconnected',
      comment: 'Current connection status'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    timestamps: true,
    paranoid: true // Soft delete
  });

  return Account;
};
