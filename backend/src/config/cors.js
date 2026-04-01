const cors = require('cors');
const config = require('./env');

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || config.CORS_ORIGINS.indexOf(origin) !== -1 || config.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS: Origem não permitida'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

module.exports = cors(corsOptions);
