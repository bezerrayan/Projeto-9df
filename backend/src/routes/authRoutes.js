// ---- authRoutes.js ----
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/login', authController.login);
router.get('/session', authenticateToken, authController.session);
router.post('/logout', authController.logout);

module.exports = router;
