const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const config = require('../config/env');
const db = require('../config/database');

async function findByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  
  if (config.DB_MODE === 'mysql') {
    const [rows] = await db.getPool().query(
      "SELECT email, password_hash AS passwordHash, active FROM admins WHERE email = ? LIMIT 1",
      [normalized]
    );
    return rows[0] || null;
  }

  const data = JSON.parse(fs.readFileSync(db.paths.admins, 'utf8'));
  return (data.admins || []).find(a => a.email === normalized) || null;
}

async function login(email, password) {
  const admin = await findByEmail(email);
  if (!admin || !admin.active) throw new Error('invalid_credentials');

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) throw new Error('invalid_credentials');

  const token = jwt.sign({ email: admin.email }, config.JWT_SECRET, { expiresIn: '7d' });
  return { email: admin.email, token };
}

module.exports = {
  findByEmail,
  login
};
