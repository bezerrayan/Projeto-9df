const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./env');

const CONTENT_PATH = path.join(config.PATHS.DATA, 'site_content.json');
const ADMINS_PATH = path.join(config.PATHS.DATA, 'admin_auth.json');
const MESSAGES_PATH = path.join(config.PATHS.DATA, 'contact_messages.json');
const MAIL_MESSAGES_PATH = path.join(config.PATHS.DATA, 'mail_messages.json');

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
      try {
        await pool.end();
      } catch {}
      pool = null;
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
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id INT PRIMARY KEY,
        content_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mail_inbox_messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        message_id VARCHAR(255) NOT NULL UNIQUE,
        uid BIGINT NULL,
        from_email VARCHAR(255) NULL,
        from_name VARCHAR(255) NULL,
        subject VARCHAR(255) NULL,
        text_body MEDIUMTEXT NULL,
        html_body MEDIUMTEXT NULL,
        received_at DATETIME NULL,
        folder_original VARCHAR(255) NULL,
        folder_destino VARCHAR(255) NULL,
        status_processamento VARCHAR(100) NOT NULL DEFAULT 'processed',
        processing_error TEXT NULL,
        attachments_json JSON NULL,
        headers_json JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_mail_inbox_messages_status (status_processamento),
        INDEX idx_mail_inbox_messages_received_at (received_at)
      )
    `);

    // --- Automatic Migration (JSON -> MySQL) ---
    const [adminRows] = await pool.query("SELECT id FROM admins LIMIT 1");
    if (!adminRows.length && fs.existsSync(ADMINS_PATH)) {
      try {
        const data = JSON.parse(fs.readFileSync(ADMINS_PATH, 'utf8'));
        if (data.admins) {
          for (const a of data.admins) {
            await pool.query("INSERT IGNORE INTO admins (email, password_hash, active) VALUES (?, ?, ?)", [a.email, a.passwordHash, a.active ? 1 : 0]);
          }
        }
      } catch (e) {}
    }

    const [contentRows] = await pool.query("SELECT content_json FROM site_content WHERE id = 1 LIMIT 1");
    let needsContentUpdate = !contentRows.length;
    
    // Se a tabela já existir mas estiver com o conteúdo padrão "vazio", vamos forçar a migração do JSON
    if (contentRows.length) {
      const currentContent = JSON.parse(contentRows[0].content_json);
      if (!currentContent.adminPanel || (!currentContent.adminPanel.links || currentContent.adminPanel.links.length === 0)) {
        needsContentUpdate = true;
        console.log("[DB] Banco detectado como vazio de links. Forçando atualização do JSON...");
      }
    }

    if (needsContentUpdate) {
      let initialContent = { pages: {}, adminPanel: {} };
      if (fs.existsSync(CONTENT_PATH)) {
        try { 
          initialContent = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8')); 
          await pool.query("INSERT INTO site_content (id, content_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE content_json = ?", [JSON.stringify(initialContent), JSON.stringify(initialContent)]);
          console.log("[DB] Conteúdo do site sincronizado com sucesso do JSON.");
        } catch (e) { console.error("[DB] Falha ao sincronizar JSON:", e.message); }
      }
    }

    const [msgRows] = await pool.query("SELECT id FROM contact_messages LIMIT 1");
    if (!msgRows.length && fs.existsSync(MESSAGES_PATH)) {
      try {
        const data = JSON.parse(fs.readFileSync(MESSAGES_PATH, 'utf8'));
        if (data.messages) {
          for (const m of data.messages) {
            await pool.query("INSERT IGNORE INTO contact_messages (id, name, email, subject, message, is_read, date) VALUES (?, ?, ?, ?, ?, ?, ?)", [m.id, m.name, m.email, m.subject, m.message, m.is_read ? 1 : 0, m.date]);
          }
        }
      } catch (e) {}
    }
  } else {
    // Ensure file structures exist
    if (!fs.existsSync(config.PATHS.DATA)) fs.mkdirSync(config.PATHS.DATA, { recursive: true });
    if (!fs.existsSync(CONTENT_PATH)) fs.writeFileSync(CONTENT_PATH, JSON.stringify({ pages: {}, adminPanel: {} }, null, 2));
    if (!fs.existsSync(ADMINS_PATH)) fs.writeFileSync(ADMINS_PATH, JSON.stringify({ admins: [] }, null, 2));
    if (!fs.existsSync(MESSAGES_PATH)) fs.writeFileSync(MESSAGES_PATH, JSON.stringify({ messages: [] }, null, 2));
    if (!fs.existsSync(MAIL_MESSAGES_PATH)) fs.writeFileSync(MAIL_MESSAGES_PATH, JSON.stringify({ messages: [] }, null, 2));
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
    mailMessages: MAIL_MESSAGES_PATH,
  }
};
