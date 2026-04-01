const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('Testando conexão com o banco de dados...');
  console.log('Configurações:', {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT
  });

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: Number(process.env.MYSQL_PORT || 3306)
    });
    console.log('✅ Conexão estabelecida com sucesso!');
    await connection.end();
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
