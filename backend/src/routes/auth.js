const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register',
  [
    body('username').isString().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('role').optional().isIn(['admin', 'operator', 'viewer']).withMessage('Invalid role')
  ],
  validate,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  [
    body('username').isString().withMessage('Username is required'),
    body('password').isString().withMessage('Password is required')
  ],
  validate,
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me',
  auth.verifyToken,
  authController.getMe
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  auth.verifyToken,
  [
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('preferences').optional().isObject()
  ],
  validate,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  auth.verifyToken,
  [
    body('currentPassword').isString().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validate,
  authController.changePassword
);

module.exports = router;
