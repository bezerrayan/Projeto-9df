const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticateToken } = require('../middlewares/auth');
const validator = require('../validators/contentValidator');

// Public route for landing page
router.get('/', contentController.getSiteContent);

// Private route for admin panel
router.get('/admin', authenticateToken, contentController.getSiteContent);

// Save updated content
router.post('/', authenticateToken, (req, res, next) => {
  try {
    req.body = validator.sanitize(req.body);
    next();
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
}, contentController.updateSiteContent);

// Metadata for pages
router.get('/pages', authenticateToken, (req, res) => {
  res.json({ pages: validator.ADMIN_PAGES });
});

module.exports = router;
