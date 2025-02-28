const express = require('express');
const router = express.Router();

// Este arquivo foi criado para resolver uma dependência, 
// mas as funcionalidades do Instagram ainda não foram implementadas.

// Rota básica para verificação
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Instagram API routes loaded but not implemented yet'
  });
});

/**
 * @route   GET /api/instagram/accounts
 * @desc    Get all Instagram accounts
 * @access  Public (for testing - should be private in production)
 */
router.get('/accounts', (req, res) => {
  res.status(200).json({
    status: 'success',
    count: 0,
    data: []
  });
});

module.exports = router;
