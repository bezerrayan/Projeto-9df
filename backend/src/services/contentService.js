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
    return normalizeContent(JSON.parse(raw));
  }
  const raw = fs.readFileSync(db.paths.content, 'utf8');
  return normalizeContent(JSON.parse(raw));
}

async function save(data) {
  if (config.DB_MODE === 'mysql') {
    await db.getPool().query("UPDATE site_content SET content_json = ? WHERE id = 1", [JSON.stringify(data)]);
    return;
  }
  fs.writeFileSync(db.paths.content, JSON.stringify(data, null, 2));
}

module.exports = {
  load,
  save
};
