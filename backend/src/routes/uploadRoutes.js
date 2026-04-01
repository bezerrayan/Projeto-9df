const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middlewares/auth');
const { upload, uploadDoc } = require('../config/cloudinary');

// Rotas de upload protegidas
router.post('/image', authenticateToken, upload.single('image'), uploadController.uploadImage);
router.post('/document', authenticateToken, uploadDoc.single('file'), uploadController.uploadDoc);

module.exports = router;
