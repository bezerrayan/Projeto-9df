const authService = require('../services/authService');
const config = require('../config/env');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { email: adminEmail, token } = await authService.login(email, password);

    // Secure cookie for protection
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'none', // Needed for cross-site (Railway backend, Hostinger frontend)
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ ok: true, email: adminEmail, token });
  } catch (error) {
    if (error.message === 'invalid_credentials') {
      return res.status(401).json({ ok: false, error: 'invalid_credentials' });
    }
    next(error);
  }
}

async function session(req, res) {
  res.json({
    authenticated: true,
    email: req.adminEmail,
  });
}

function logout(req, res) {
  res.clearCookie('token');
  res.json({ ok: true });
}

module.exports = {
  login,
  session,
  logout
};
