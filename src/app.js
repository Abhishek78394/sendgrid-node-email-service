const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const emailRoutes = require('./routes/email.routes');
const queuedEmailRoutes = require('./routes/queuedEmail.routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || false
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 50 }));

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${Date.now() - start}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length')
    });
  });

  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      usedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      totalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/email/queued', queuedEmailRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'SendGrid Email Service API',
    version: '1.0.0',
    documentation: '/api/email',
    health: '/health'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: {
      health: 'GET /health',
      sendEmail: 'POST /api/email/send',
      sendTemplate: 'POST /api/email/send-template',
      sendBulk: 'POST /api/email/send-bulk',
      sendBulkCached: 'POST /api/email/send-bulk-cached'
    }
  });
});

app.use(errorHandler);

module.exports = app;
