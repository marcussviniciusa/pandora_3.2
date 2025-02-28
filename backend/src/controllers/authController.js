const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { UserModel, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * User registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this username or email already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      role: role || 'operator',
      isActive: true,
      lastLogin: null
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'pandora-secret-key',
      { expiresIn: '24h' }
    );
    
    // Return user without password
    const { password: pwd, ...userData } = user.toJSON();
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    logger.error('Error registering user:', error);
    next(error);
  }
};

/**
 * User login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Check if user exists
    const user = await UserModel.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username } // Allow login with email as username
        ],
        isActive: true
      }
    });
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'pandora-secret-key',
      { expiresIn: '24h' }
    );
    
    // Return user without password
    const { password: pwd, ...userData } = user.toJSON();
    
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    logger.error('Error logging in user:', error);
    next(error);
  }
};

/**
 * Get current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getMe = async (req, res, next) => {
  try {
    // User is already attached to request by auth middleware
    res.status(200).json({
      status: 'success',
      data: req.user
    });
  } catch (error) {
    logger.error('Error getting user profile:', error);
    next(error);
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email, preferences } = req.body;
    
    // Get user from database
    const user = await UserModel.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) {
      // Check if email is already taken
      const existingUser = await UserModel.findOne({
        where: {
          email,
          id: { [Op.ne]: req.user.id }
        }
      });
      
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already taken'
        });
      }
      
      user.email = email;
    }
    if (preferences !== undefined) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
    }
    
    // Save changes
    await user.save();
    
    // Return updated user without password
    const { password, ...userData } = user.toJSON();
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: userData
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    next(error);
  }
};

/**
 * Change password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user from database
    const user = await UserModel.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Error changing password:', error);
    next(error);
  }
};
