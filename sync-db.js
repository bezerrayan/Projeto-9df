const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

async function sync() {
  console.log("Iniciando sincronização entre site_content.json e MySQL...");
  
  const contentPath = path.join(__dirname, "site_content.json");
  if (!fs.existsSync(contentPath)) {
    console.error("Erro: arquivo site_content.json não encontrado.");
    process.exit(1);
  }

  const raw = fs.readFileSync(contentPath, "utf-8");
  const content = JSON.parse(raw);

  const config = {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log("Conectado ao MySQL com sucesso.");

    // Sincroniza site_content (ID 1)
    await connection.execute(
      "UPDATE site_content SET content_json = ? WHERE id = 1",
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
