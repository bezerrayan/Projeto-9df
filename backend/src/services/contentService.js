const fs = require('fs');
const db = require('../config/database');
const config = require('../config/env');

function normalizeContent(data) {
  return {
    pages: data.pages || {},
    adminPanel: data.adminPanel || {},
  };
}

async function load() {
  if (config.DB_MODE === 'mysql') {
    const [rows] = await db.getPool().query("SELECT content_json FROM site_content WHERE id = 1 LIMIT 1");
    const raw = (rows && rows[0]) ? rows[0].content_json : "{}";
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return normalizeContent(parsed);
  }
  const raw = fs.readFileSync(db.paths.content, 'utf8');
  return normalizeContent(JSON.parse(raw));
}

async function save(data) {
  const normalized = normalizeContent(data || {});
  if (config.DB_MODE === 'mysql') {
    await db.getPool().query(
      "INSERT INTO site_content (id, content_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE content_json = VALUES(content_json)",
      [JSON.stringify(normalized)]
    );
    return;
  }
  fs.writeFileSync(db.paths.content, JSON.stringify(normalized, null, 2));
}

module.exports = {
  load,
  save
};
