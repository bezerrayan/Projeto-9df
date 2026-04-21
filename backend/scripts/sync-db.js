const fs = require("fs");
const mysql = require("mysql2/promise");
const config = require("../src/config/env");
const db = require("../src/config/database");

async function sync() {
  console.log("Iniciando sincronização entre site_content.json e MySQL...");
  
  const contentPath = db.paths.content;
  if (!fs.existsSync(contentPath)) {
    console.error("Erro: arquivo site_content.json não encontrado.");
    process.exit(1);
  }

  const raw = fs.readFileSync(contentPath, "utf-8");
  const content = JSON.parse(raw);

  const dbConfig = {
    host: config.DATABASE.HOST,
    user: config.DATABASE.USER,
    password: config.DATABASE.PASSWORD,
    database: config.DATABASE.NAME,
    port: config.DATABASE.PORT,
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Conectado ao MySQL com sucesso.");

    // Sincroniza site_content (ID 1)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS site_content (
        id INT PRIMARY KEY,
        content_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(
      "INSERT INTO site_content (id, content_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE content_json = VALUES(content_json)",
      [JSON.stringify(content)]
    );
    console.log("Banco de dados MySQL atualizado com sucesso (site_content).");

    await connection.end();
    console.log("Sincronização finalizada.");
  } catch (error) {
    console.error("Erro ao sincronizar com MySQL:", error);
    process.exit(1);
  }
}

sync();
