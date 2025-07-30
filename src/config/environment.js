require('dotenv').config();

const requiredEnvVars = [
  'SENDGRID_API_KEY',
  'SENDGRID_VERIFIED_SENDER'
];

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(process.env.SENDGRID_VERIFIED_SENDER)) {
  throw new Error('SENDGRID_VERIFIED_SENDER must be a valid email address');
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_VERIFIED_SENDER: process.env.SENDGRID_VERIFIED_SENDER,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  RATE_LIMIT: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 10
  }
};