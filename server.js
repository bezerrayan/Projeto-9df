const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const BASE_DIR = __dirname;
const LOCAL_ENV_PATH = path.join(BASE_DIR, ".env.local");
const DEFAULT_ENV_PATH = path.join(BASE_DIR, ".env");

dotenv.config({ path: DEFAULT_ENV_PATH });
if (fs.existsSync(LOCAL_ENV_PATH)) {
  dotenv.config({ path: LOCAL_ENV_PATH, override: true });
}

const app = express();
const CONTENT_PATH = path.join(BASE_DIR, "site_content.json");
const ADMINS_PATH = path.join(BASE_DIR, "admin_auth.json");
const MESSAGES_PATH = path.join(BASE_DIR, "contact_messages.json");
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "0.0.0.0";
const DB_MODE = (process.env.DB_MODE || "file").toLowerCase();
const JWT_SECRET = process.env.JWT_SECRET || "gear9df-dev-secret-change-me";

// ── Cloudinary Config ─────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_DIR = path.join(BASE_DIR, "images", "galeria");
const UPLOAD_DOCS_DIR = path.join(BASE_DIR, "docs");

const ALLOWED_IMAGE_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png", ".svg"]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const LINUX_SAFE_IMAGE_RE = /^images\/[a-z0-9/_-]+\.(webp|jpg|jpeg|png|svg)$/;

const ALLOWED_DOC_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx"]);
const MAX_DOC_BYTES = 15 * 1024 * 1024;

const PUBLIC_PAGES = new Set([
  "index.html",
  "sobre.html",
  "atividades.html",
  "galeria.html",
  "ramo.html",
  "projetos.html",
  "contato.html",
  "documentos.html",
  "equipe.html",
  "participar.html",
  "links.html",
]);

const ADMIN_PAGES = {
  "index.html": "Inicio",
  "sobre.html": "Sobre",
  "atividades.html": "Atividades",
  "galeria.html": "Galeria",
  "ramo.html": "Ramos",
  "projetos.html": "Projetos",
  "contato.html": "Contato",
  "documentos.html": "Documentos",
  "equipe.html": "Equipe",
  "participar.html": "Participar",
  "links.html": "Links uteis",
};

let pool = null;

app.use(cors());
app.use(express.json({ limit: "4mb" }));

// ── Multer upload config ──────────────────────────────────────────
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DOCS_DIR)) {
  fs.mkdirSync(UPLOAD_DOCS_DIR, { recursive: true });
}

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gear9df/galeria",
    allowed_formats: ["jpg", "png", "webp", "svg"],
  },
});

const upload = multer({ storage: storage });

const docStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gear9df/documentos",
    allowed_formats: ["pdf", "doc", "docx", "xls", "xlsx"],
    resource_type: "raw", // Needed for non-image files
  },
});

const uploadDoc = multer({ storage: docStorage });

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args[0] === "--create-admin" && args.length >= 3) {
    return { createAdmin: { email: args[1], password: args[2] } };
  }
  return {};
}

function ensureContentFile() {
  if (!fs.existsSync(CONTENT_PATH)) {
    writeJsonFile(CONTENT_PATH, { pages: {}, adminPanel: {} });
  }
}

function ensureAdminsFile() {
  if (!fs.existsSync(ADMINS_PATH)) {
    writeJsonFile(ADMINS_PATH, { admins: [] });
  }
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function initializeStorage() {
  if (DB_MODE === "mysql") {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
      queueLimit: 0,
    });

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
    return;
  }

  ensureContentFile();
  ensureAdminsFile();
}

function normalizeContentPayload(payload) {
  const data = payload && typeof payload === "object" ? payload : {};
  return {
    pages: data.pages && typeof data.pages === "object" ? data.pages : {},
    adminPanel: data.adminPanel && typeof data.adminPanel === "object" ? data.adminPanel : {},
  };
}

async function loadContent() {
  if (DB_MODE === "mysql") {
    const [rows] = await pool.query("SELECT content_json FROM site_content WHERE id = 1 LIMIT 1");
    const raw = rows[0]?.content_json || "{}";
    return normalizeContentPayload(JSON.parse(raw));
  }
  ensureContentFile();
  return normalizeContentPayload(readJsonFile(CONTENT_PATH, { pages: {}, adminPanel: {} }));
}

async function saveContent(data) {
  if (DB_MODE === "mysql") {
    await pool.query("UPDATE site_content SET content_json = ? WHERE id = 1", [JSON.stringify(data)]);
    return;
  }
  writeJsonFile(CONTENT_PATH, data);
}

async function findAdminByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (DB_MODE === "mysql") {
    const [rows] = await pool.query(
      "SELECT email, password_hash AS passwordHash, active FROM admins WHERE email = ? LIMIT 1",
      [normalized]
    );
    return rows[0] || null;
  }

  ensureAdminsFile();
  const data = readJsonFile(ADMINS_PATH, { admins: [] });
  return (Array.isArray(data.admins) ? data.admins : []).find((admin) => admin.email === normalized) || null;
}

async function upsertAdmin(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const passwordHash = await bcrypt.hash(String(password || ""), 10);

  if (DB_MODE === "mysql") {
    await pool.query(
      `
        INSERT INTO admins (email, password_hash, active)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), active = 1
      `,
      [normalizedEmail, passwordHash]
    );
    return;
  }

  ensureAdminsFile();
  const data = readJsonFile(ADMINS_PATH, { admins: [] });
  const admins = Array.isArray(data.admins) ? data.admins : [];
  const existingIndex = admins.findIndex((admin) => admin.email === normalizedEmail);
  const adminRecord = { email: normalizedEmail, passwordHash, active: true };

  if (existingIndex >= 0) {
    admins[existingIndex] = adminRecord;
  } else {
    admins.push(adminRecord);
  }

  writeJsonFile(ADMINS_PATH, { admins });
}

function sanitizeContentPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { pages: {}, adminPanel: {} };
  }

  const pages = payload.pages && typeof payload.pages === "object" ? payload.pages : {};
  const cleaned = { pages: {}, adminPanel: {} };

  for (const [pageName, pageData] of Object.entries(pages)) {
    if (!ADMIN_PAGES[pageName] || !pageData || typeof pageData !== "object") {
      continue;
    }

    cleaned.pages[pageName] = {
      text: pageData.text && typeof pageData.text === "object" ? pageData.text : {},
      images: pageData.images && typeof pageData.images === "object" ? pageData.images : {},
      sections: pageData.sections && typeof pageData.sections === "object" ? pageData.sections : {},
      extras: Array.isArray(pageData.extras) ? pageData.extras : [],
    };
  }

  cleaned.adminPanel = sanitizeAdminPanel(payload.adminPanel && typeof payload.adminPanel === "object" ? payload.adminPanel : {});
  return cleaned;
}

function sanitizeAdminPanel(adminPanel) {
  const cleaned = { ...adminPanel };
  const photos = Array.isArray(cleaned.photos) ? cleaned.photos : [];
  cleaned.photos = photos.map((photo) => validateGalleryPhoto(photo));
  return cleaned;
}

function validateGalleryPhoto(photo) {
  if (!photo || typeof photo !== "object") {
    throw new Error("invalid_gallery_photo:item invalido");
  }

  const src = String(photo.src || "").trim().replace(/\\/g, "/");
  const title = String(photo.title || "").trim();
  const category = String(photo.category || "atividade").trim() || "atividade";
  const caption = String(photo.caption || title).trim();

  if (!title || !src) {
    throw new Error("invalid_gallery_photo:titulo e caminho sao obrigatorios");
  }

  if (!LINUX_SAFE_IMAGE_RE.test(src)) {
    throw new Error("invalid_gallery_photo:use images/ com minusculas, sem espaco e sem acento");
  }

  const extension = path.extname(src).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error("invalid_gallery_photo:formato nao permitido");
  }

  const fullPath = path.normalize(path.join(BASE_DIR, src));
  const imagesRoot = path.normalize(path.join(BASE_DIR, "images"));

  if (!fullPath.startsWith(imagesRoot + path.sep)) {
    throw new Error("invalid_gallery_photo:caminho fora da pasta images");
  }

  const fileExists = fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
  if (!fileExists) {
    console.warn(`[Gallery] Arquivo não encontrado fisicamente (ignorado no salvamento): ${src}`);
  } else {
    // Only check size if file actually exists
    if (fs.statSync(fullPath).size > MAX_IMAGE_BYTES) {
      throw new Error("invalid_gallery_photo:arquivo acima de 2 MB");
    }
  }

  return {
    id: String(photo.id || "").trim(),
    title,
    category,
    caption,
    src,
  };
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ ok: false, error: "unauthorized" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ ok: false, error: "forbidden" });
    req.adminEmail = decoded.email;
    next();
  });
}

const loginRequired = authenticateToken;

app.get("/login", (_req, res) => {
  res.sendFile(path.join(BASE_DIR, "login.html"));
});

app.get("/admin", (req, res) => {
  // We keep this simple since frontend handles token
  return res.sendFile(path.join(BASE_DIR, "admin.html"));
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "missing_credentials" });
    }

    const admin = await findAdminByEmail(email);
    if (!admin || !admin.active) {
      return res.status(401).json({ ok: false, error: "invalid_credentials" });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ ok: false, error: "invalid_credentials" });
    }

    const token = jwt.sign({ email: admin.email }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ ok: true, email: admin.email, token });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/auth/session", authenticateToken, (req, res) => {
  res.json({
    authenticated: true,
    email: req.adminEmail,
  });
});

app.get("/api/site-content", async (_req, res, next) => {
  try {
    res.json(await loadContent());
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/content", loginRequired, async (_req, res, next) => {
  try {
    res.json(await loadContent());
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/content", loginRequired, async (req, res, next) => {
  try {
    const cleaned = sanitizeContentPayload(req.body);
    await saveContent(cleaned);
    res.json({ ok: true });
  } catch (error) {
    if (error.message && error.message.startsWith("invalid_gallery_photo:")) {
      return res.status(400).json({ ok: false, error: error.message });
    }
    return next(error);
  }
});

app.get("/api/admin/pages", loginRequired, (_req, res) => {
  res.json({ pages: ADMIN_PAGES });
});

// ── Image upload ──────────────────────────────────────────────────
app.post("/api/admin/upload", loginRequired, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "Nenhum arquivo enviado." });
  }
  res.json({ ok: true, path: req.file.path, filename: req.file.filename });
});

app.post("/api/admin/upload-doc", loginRequired, uploadDoc.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "Nenhum arquivo enviado." });
  }
  res.json({ ok: true, path: req.file.path, filename: req.file.filename });
});

// ── Contact messages (public) ─────────────────────────────────────
app.post("/api/contact", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }

    const msg = {
      id: "msg-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: String(name).trim().slice(0, 200),
      email: String(email).trim().slice(0, 200),
      subject: String(subject || "Contato pelo site").trim().slice(0, 200),
      message: String(message).trim().slice(0, 5000),
      date: new Date().toISOString(),
      read: false,
    };

    if (DB_MODE === "mysql") {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS contact_messages (
          id VARCHAR(30) PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          email VARCHAR(200) NOT NULL,
          subject VARCHAR(200),
          message TEXT NOT NULL,
          date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          is_read TINYINT(1) NOT NULL DEFAULT 0
        )`
      );
      await pool.query(
        "INSERT INTO contact_messages (id, name, email, subject, message, is_read) VALUES (?, ?, ?, ?, ?, 0)",
        [msg.id, msg.name, msg.email, msg.subject, msg.message]
      );
    } else {
      const messages = readJsonFile(MESSAGES_PATH, { messages: [] });
      if (!Array.isArray(messages.messages)) messages.messages = [];
      messages.messages.push(msg);
      writeJsonFile(MESSAGES_PATH, messages);
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// ── Admin messages ────────────────────────────────────────────────
app.get("/api/admin/messages", loginRequired, async (_req, res, next) => {
  try {
    if (DB_MODE === "mysql") {
      const [rows] = await pool.query("SELECT * FROM contact_messages ORDER BY date DESC");
      return res.json({ messages: rows });
    }
    const data = readJsonFile(MESSAGES_PATH, { messages: [] });
    const msgs = Array.isArray(data.messages) ? data.messages : [];
    msgs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    res.json({ messages: msgs });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/messages/:id/read", loginRequired, async (req, res, next) => {
  try {
    const msgId = req.params.id;
    if (DB_MODE === "mysql") {
      await pool.query("UPDATE contact_messages SET is_read = 1 WHERE id = ?", [msgId]);
      return res.json({ ok: true });
    }
    const data = readJsonFile(MESSAGES_PATH, { messages: [] });
    const msg = (data.messages || []).find((m) => m.id === msgId);
    if (msg) msg.read = true;
    writeJsonFile(MESSAGES_PATH, data);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/messages/:id", loginRequired, async (req, res, next) => {
  try {
    const msgId = req.params.id;
    if (DB_MODE === "mysql") {
      await pool.query("DELETE FROM contact_messages WHERE id = ?", [msgId]);
      return res.json({ ok: true });
    }
    const data = readJsonFile(MESSAGES_PATH, { messages: [] });
    data.messages = (data.messages || []).filter((m) => m.id !== msgId);
    writeJsonFile(MESSAGES_PATH, data);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// ── Export data ───────────────────────────────────────────────────
app.get("/api/admin/export", loginRequired, async (_req, res, next) => {
  try {
    const content = await loadContent();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="backup_9df_${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(content);
  } catch (error) {
    next(error);
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(BASE_DIR, "index.html"));
});

app.get(/^\/(.+)$/, (req, res) => {
  const requestedPath = String(req.params[0] || "");
  const fullPath = path.join(BASE_DIR, requestedPath);

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return res.sendFile(fullPath);
  }

  if (PUBLIC_PAGES.has(requestedPath)) {
    return res.sendFile(path.join(BASE_DIR, requestedPath));
  }

  return res.status(404).send(`Arquivo '${requestedPath}' nao encontrado.`);
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, error: "internal_error" });
});

async function main() {
  const args = parseArgs(process.argv);
  await initializeStorage();

  if (args.createAdmin) {
    await upsertAdmin(args.createAdmin.email, args.createAdmin.password);
    console.log(`Administrador atualizado: ${args.createAdmin.email}`);
    return;
  }

  app.listen(PORT, HOST, () => {
    console.log(`Servidor Node rodando em http://127.0.0.1:${PORT}`);
    console.log(`Modo de persistencia: ${DB_MODE}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
