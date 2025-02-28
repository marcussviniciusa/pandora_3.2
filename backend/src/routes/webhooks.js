const express = require('express');
const router = express.Router();

// Este arquivo foi criado para resolver uma dependência, 
// mas as funcionalidades de webhooks serão implementadas posteriormente.

// Rota básica para verificação
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Webhooks API routes loaded but not fully implemented yet'
  });
});

module.exports = router;
