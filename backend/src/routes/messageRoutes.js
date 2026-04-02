const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middlewares/auth');

// Rota pública para envio de mensagens
router.post('/', messageController.sendContactMessage);

// Rotas administrativas (Gerenciamento de mensagens)
router.get('/', authenticateToken, messageController.getMessages);
router.post('/:id/read', authenticateToken, messageController.markAsRead);
router.post('/:id/reply', authenticateToken, messageController.replyToMessage);
router.delete('/:id', authenticateToken, messageController.deleteMessage);

module.exports = router;
