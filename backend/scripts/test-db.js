const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function testConnection() {
  const usingDatabaseUrl = Boolean(config.DATABASE.URL);
  const connectionConfig = usingDatabaseUrl
    ? config.DATABASE.URL
    : {
        host: config.DATABASE.HOST,
        user: config.DATABASE.USER,
        password: config.DATABASE.PASSWORD,
        database: config.DATABASE.NAME,
        port: config.DATABASE.PORT
      };

  console.log('Testando conexão com o banco de dados...');
  console.log('Configurações:', {
    mode: usingDatabaseUrl ? 'DATABASE_URL' : 'variaveis-separadas',
    host: usingDatabaseUrl ? '(via DATABASE_URL)' : config.DATABASE.HOST,
    user: usingDatabaseUrl ? '(via DATABASE_URL)' : config.DATABASE.USER,
    database: usingDatabaseUrl ? '(via DATABASE_URL)' : config.DATABASE.NAME,
    port: usingDatabaseUrl ? '(via DATABASE_URL)' : config.DATABASE.PORT
  });

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Conexão estabelecida com sucesso!');
    await connection.end();
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
