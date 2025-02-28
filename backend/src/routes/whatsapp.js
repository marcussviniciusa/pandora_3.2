const express = require('express');
const { body, param, query } = require('express-validator');
const whatsappController = require('../controllers/whatsappController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @route   GET /api/whatsapp/test
 * @desc    Test WhatsApp connection (no auth required - testing only)
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'WhatsApp routes are working correctly',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/whatsapp/test/account
 * @desc    Create a test WhatsApp account (no auth required - testing only)
 * @access  Public
 */
router.post('/test/account',
  [
    body('phoneNumber').isString().notEmpty().withMessage('Phone number is required')
  ],
  validate,
  whatsappController.createAccount
);

/**
 * @route   GET /api/whatsapp/accounts
 * @desc    Get all WhatsApp accounts
 * @access  Private
 */
router.get('/accounts', 
  auth.verifyToken,
  whatsappController.getAccounts
);

/**
 * @route   POST /api/whatsapp/accounts
 * @desc    Create a new WhatsApp account
 * @access  Private
 */
router.post('/accounts',
  auth.verifyToken,
  auth.isAdmin,
  [
    body('phoneNumber').isString().notEmpty().withMessage('Phone number is required')
  ],
  validate,
  whatsappController.createAccount
);

/**
 * @route   GET /api/whatsapp/accounts/:id
 * @desc    Get WhatsApp account by ID
 * @access  Private
 */
router.get('/accounts/:id',
  auth.verifyToken,
  [
    param('id').isUUID().withMessage('Invalid account ID')
  ],
  validate,
  whatsappController.getAccountById
);

/**
 * @route   DELETE /api/whatsapp/accounts/:id
 * @desc    Remove a WhatsApp account
 * @access  Private
 */
router.delete('/accounts/:id',
  auth.verifyToken,
  auth.isAdmin,
  [
    param('id').isUUID().withMessage('Invalid account ID')
  ],
  validate,
  whatsappController.removeAccount
);

/**
 * @route   GET /api/whatsapp/accounts/:id/status
 * @desc    Get WhatsApp connection status
 * @access  Private
 */
router.get('/accounts/:id/status',
  auth.verifyToken,
  [
    param('id').isUUID().withMessage('Invalid account ID')
  ],
  validate,
  whatsappController.getStatus
);

/**
 * @route   POST /api/whatsapp/accounts/:id/reconnect
 * @desc    Force reconnection of WhatsApp account
 * @access  Private
 */
router.post('/accounts/:id/reconnect',
  auth.verifyToken,
  [
    param('id').isUUID().withMessage('Invalid account ID')
  ],
  validate,
  whatsappController.reconnect
);

/**
 * @route   POST /api/whatsapp/send
 * @desc    Send WhatsApp message
 * @access  Private
 */
router.post('/send',
  auth.verifyToken,
  [
    body('accountId').isUUID().withMessage('Invalid account ID'),
    body('to').isString().notEmpty().withMessage('Recipient is required'),
    body('message').isString().notEmpty().withMessage('Message content is required')
  ],
  validate,
  whatsappController.sendMessage
);

/**
 * @route   POST /api/whatsapp/bulk-send
 * @desc    Send bulk WhatsApp messages
 * @access  Private
 */
router.post('/bulk-send',
  auth.verifyToken,
  [
    body('accountId').isUUID().withMessage('Invalid account ID'),
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('recipients.*.to').isString().notEmpty().withMessage('Recipient is required'),
    body('message').isString().notEmpty().withMessage('Message content is required')
  ],
  validate,
  whatsappController.sendBulkMessages
);

/**
 * @route   GET /api/whatsapp/qr/:id
 * @desc    Get QR code for WhatsApp account
 * @access  Private
 */
router.get('/qr/:id',
  auth.verifyToken,
  [
    param('id').isUUID().withMessage('Invalid account ID')
  ],
  validate,
  whatsappController.getQRCode
);

module.exports = router;
