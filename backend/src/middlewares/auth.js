const jwt = require('jsonwebtoken');
const config = require('../config/env');

function authenticateToken(req, res, next) {
  // Check header or cookie
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

  if (!token) return res.status(401).json({ ok: false, error: 'unauthorized' });

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ ok: false, error: 'forbidden' });
    req.adminEmail = decoded.email;
    next();
  });
}

module.exports = {
  authenticateToken
};
