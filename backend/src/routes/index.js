const express = require('express');
const authRoutes = require('./auth');
const whatsappRoutes = require('./whatsapp');
const instagramRoutes = require('./instagram');
const messageRoutes = require('./messages');
const conversationRoutes = require('./conversations');
const contactRoutes = require('./contacts');
const webhookRoutes = require('./webhooks');
const userRoutes = require('./users');
const dashboardRoutes = require('./dashboard');

const router = express.Router();

// API version
router.get('/', (req, res) => {
  res.json({ 
    name: 'Pandora API',
    version: '3.2.0',
    status: 'running'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/instagram', instagramRoutes);
router.use('/messages', messageRoutes);
router.use('/conversations', conversationRoutes);
router.use('/contacts', contactRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
