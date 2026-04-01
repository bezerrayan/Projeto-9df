const path = require('path');
const dotenv = require('dotenv');

// Load .env and .env.local
const BASE_DIR = path.join(__dirname, '../../');
dotenv.config({ path: path.join(BASE_DIR, '.env') });
dotenv.config({ path: path.join(BASE_DIR, '.env.local'), override: true });

module.exports = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_MODE: (process.env.DB_MODE || 'file').toLowerCase(),
  JWT_SECRET: process.env.JWT_SECRET || 'strong-secret-needed-for-production',
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  
  DATABASE: {
    URL: process.env.DATABASE_URL, // Railway provides this
    HOST: process.env.MYSQL_HOST || 'localhost',
    PORT: Number(process.env.MYSQL_PORT || 3306),
    USER: process.env.MYSQL_USER,
    PASSWORD: process.env.MYSQL_PASSWORD,
    NAME: process.env.MYSQL_DATABASE,
    LIMIT: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  },

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },

  PATHS: {
    BASE: BASE_DIR,
    DATA: path.join(BASE_DIR, 'data'),
    FRONTEND: path.join(BASE_DIR, '../frontend'),
  }
};
