const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./env');

const CONTENT_PATH = path.join(config.PATHS.DATA, 'site_content.json');
const ADMINS_PATH = path.join(config.PATHS.DATA, 'admin_auth.json');
const MESSAGES_PATH = path.join(config.PATHS.DATA, 'contact_messages.json');

let pool = null;

async function init() {
  if (config.DB_MODE === 'mysql') {
    const dbParams = config.DATABASE.URL ? { uri: config.DATABASE.URL } : {
      host: config.DATABASE.HOST,
      port: config.DATABASE.PORT,
      user: config.DATABASE.USER,
      password: config.DATABASE.PASSWORD,
      database: config.DATABASE.NAME,
    };
    
    pool = mysql.createPool({ 
      ...dbParams,
      waitForConnections: true,
      connectionLimit: config.DATABASE.LIMIT,
      queueLimit: 0,
    });
    
    // Test connection
    try {
      await pool.getConnection();
      console.log('[DB] Conexão MySQL estabelecida com sucesso.');
    } catch (error) {
      console.error('[DB] Erro ao conectar ao MySQL:', error.message);
      throw error;
    }
    
    // Ensure tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id TINYINT PRIMARY KEY,
        content_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await pool.query("SELECT id FROM site_content WHERE id = 1 LIMIT 1");
    if (!rows.length) {
      await pool.query("INSERT INTO site_content (id, content_json) VALUES (1, ?)", [JSON.stringify({ pages: {}, adminPanel: {} })]);
    }
  } else {
    // Ensure file structures exist
    if (!fs.existsSync(config.PATHS.DATA)) fs.mkdirSync(config.PATHS.DATA, { recursive: true });
    if (!fs.existsSync(CONTENT_PATH)) fs.writeFileSync(CONTENT_PATH, JSON.stringify({ pages: {}, adminPanel: {} }, null, 2));
    if (!fs.existsSync(ADMINS_PATH)) fs.writeFileSync(ADMINS_PATH, JSON.stringify({ admins: [] }, null, 2));
    console.log('[DB] Usando persistência baseada em arquivos JSON.');
  }
}

function getPool() { return pool; }

module.exports = {
  init,
  getPool,
  paths: {
    content: CONTENT_PATH,
    admins: ADMINS_PATH,
    messages: MESSAGES_PATH,
  }
};
