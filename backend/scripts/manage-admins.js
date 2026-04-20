const fs = require('fs');
const bcrypt = require('bcrypt');
const config = require('../src/config/env');
const db = require('../src/config/database');

function usage() {
  console.log(`
Uso:
  node scripts/manage-admins.js add <email> <senha>
  node scripts/manage-admins.js list
  node scripts/manage-admins.js deactivate <email>
  node scripts/manage-admins.js activate <email>
`);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function loadAdminsFile() {
  const raw = fs.readFileSync(db.paths.admins, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data.admins)) data.admins = [];
  return data;
}

function saveAdminsFile(data) {
  fs.writeFileSync(db.paths.admins, JSON.stringify(data, null, 2));
}

async function addAdmin(email, password) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw new Error('Informe email e senha para adicionar o admin.');
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  if (config.DB_MODE === 'mysql') {
    await db.getPool().query(
      `INSERT INTO admins (email, password_hash, active)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         active = 1`,
      [normalizedEmail, passwordHash]
    );
    console.log(`[ADMINS] Admin salvo no MySQL: ${normalizedEmail}`);
    return;
  }

  const data = loadAdminsFile();
  const existing = data.admins.find((admin) => admin.email === normalizedEmail);

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.active = true;
  } else {
    data.admins.push({
      email: normalizedEmail,
      passwordHash,
      active: true,
    });
  }

  saveAdminsFile(data);
  console.log(`[ADMINS] Admin salvo em arquivo: ${normalizedEmail}`);
}

async function setAdminActive(email, active) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Informe o email do admin.');
  }

  if (config.DB_MODE === 'mysql') {
    const [result] = await db.getPool().query(
      'UPDATE admins SET active = ? WHERE email = ?',
      [active ? 1 : 0, normalizedEmail]
    );

    if (!result.affectedRows) {
      throw new Error(`Admin não encontrado: ${normalizedEmail}`);
    }

    console.log(`[ADMINS] Admin ${active ? 'ativado' : 'desativado'} no MySQL: ${normalizedEmail}`);
    return;
  }

  const data = loadAdminsFile();
  const existing = data.admins.find((admin) => admin.email === normalizedEmail);

  if (!existing) {
    throw new Error(`Admin não encontrado: ${normalizedEmail}`);
  }

  existing.active = !!active;
  saveAdminsFile(data);
  console.log(`[ADMINS] Admin ${active ? 'ativado' : 'desativado'} em arquivo: ${normalizedEmail}`);
}

async function listAdmins() {
  if (config.DB_MODE === 'mysql') {
    const [rows] = await db.getPool().query(
      'SELECT email, active, created_at AS createdAt FROM admins ORDER BY email ASC'
    );

    if (!rows.length) {
      console.log('[ADMINS] Nenhum admin cadastrado.');
      return;
    }

    console.table(rows.map((row) => ({
      email: row.email,
      active: !!row.active,
      createdAt: row.createdAt,
    })));
    return;
  }

  const data = loadAdminsFile();
  if (!data.admins.length) {
    console.log('[ADMINS] Nenhum admin cadastrado.');
    return;
  }

  console.table(
    data.admins.map((admin) => ({
      email: admin.email,
      active: !!admin.active,
    }))
  );
}

async function main() {
  const [, , command, ...args] = process.argv;

  if (!command) {
    usage();
    process.exit(1);
  }

  await db.init();

  switch (command) {
    case 'add':
      await addAdmin(args[0], args[1]);
      break;
    case 'list':
      await listAdmins();
      break;
    case 'activate':
      await setAdminActive(args[0], true);
      break;
    case 'deactivate':
      await setAdminActive(args[0], false);
      break;
    default:
      usage();
      process.exit(1);
  }

  if (config.DB_MODE === 'mysql' && db.getPool()) {
    await db.getPool().end();
  }
}

main().catch((error) => {
  console.error('[ADMINS ERROR]', error.message);
  process.exit(1);
});
