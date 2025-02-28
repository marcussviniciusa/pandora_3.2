const jwt = require('jsonwebtoken');
const { UserModel } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'pandora-secret-key', async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized: Invalid token'
        });
      }
      
      try {
        // Para fins de teste, se o token tiver sido gerado pela rota de teste,
        // apenas passa o usuário decodificado sem verificar no banco de dados
        if (decoded.isTestUser) {
          req.user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            firstName: decoded.firstName,
            lastName: decoded.lastName
          };
          return next();
        }
        
        // Check if user exists and is active
        const user = await UserModel.findOne({
          where: { 
            id: decoded.id,
            isActive: true
          },
          attributes: ['id', 'username', 'email', 'role', 'firstName', 'lastName']
        });
        
        if (!user) {
          return res.status(401).json({
            status: 'error',
            message: 'Unauthorized: User not found or inactive'
          });
        }
        
        // Add user object to request
        req.user = user;
        next();
      } catch (error) {
        logger.error(`Error validating user from token: ${error.message}`, error);
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error'
        });
      }
    });
  } catch (error) {
    logger.error(`Error in auth middleware: ${error.message}`, error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to check if user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: User not authenticated'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: Admin access required'
    });
  }
  
  next();
};

/**
 * Middleware to check if user is an operator or admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.isOperator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: User not authenticated'
    });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'operator') {
    return res.status(403).json({
      status: 'error',
      message: 'Forbidden: Operator access required'
    });
  }
  
  next();
};
