const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const db = require('./config/database');
const corsMiddleware = require('./config/cors');

// Importar principais rotas
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Necessário para o express-rate-limit funcionar corretamente no Railway (proxy)
app.set('trust proxy', 1);

// --- Segurança Básica ---
app.use(helmet()); 
app.use(cookieParser());
app.use(corsMiddleware);
app.use(express.json({ limit: "4mb" }));

// --- Rate Limiting (Reduzir ataques de brute force) ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { ok: false, error: 'Muitas requisições deste IP, tente novamente em 15 minutos.' }
});

// --- Rotas Principais ---
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/contact', messageRoutes); // Public and admin routes
app.use('/api/admin/upload', uploadRoutes);

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok', environment: config.NODE_ENV }));

// Error Handler Profissional
app.use((error, req, res, next) => {
  console.error('[SERVER ERROR]', error);
  res.status(500).json({ ok: false, error: config.NODE_ENV === 'production' ? 'Erro interno no servidor' : error.message });
});

async function startServer() {
  try {
    await db.init();
    app.listen(config.PORT, '0.0.0.0', () => {
      console.log(`\n\x1b[32m[SERVER]\x1b[0m Servidor rodando profissionalmente na porta ${config.PORT}`);
      console.log(`\x1b[34m[MODE]\x1b[0m Ambiente: ${config.NODE_ENV}`);
      console.log(`\x1b[34m[DB]\x1b[0m Persistência: ${config.DB_MODE}\n`);
    });
  } catch (err) {
    console.error('[STARTUP ERROR]', err);
    process.exit(1);
  }
}

startServer();
