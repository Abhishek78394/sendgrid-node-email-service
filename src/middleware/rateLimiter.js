const { RateLimiterMemory } = require('rate-limiter-flexible');
const { RATE_LIMIT } = require('../config/environment');
const logger = require('../utils/logger');

const rateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT.maxRequests,
  duration: Math.floor(RATE_LIMIT.windowMs / 1000), 
  blockDuration: Math.floor(RATE_LIMIT.windowMs / 1000),
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    
    await rateLimiter.consume(key);
    
    const resRateLimiter = await rateLimiter.get(key);
    if (resRateLimiter) {
      res.set({
        'X-RateLimit-Limit': RATE_LIMIT.maxRequests,
        'X-RateLimit-Remaining': resRateLimiter.remainingPoints || 0,
        'X-RateLimit-Reset': new Date(Date.now() + resRateLimiter.msBeforeNext || 0)
      });
    }
    
    next();
  } catch (rejRes) {
    const remainingMs = rejRes.msBeforeNext || RATE_LIMIT.windowMs;
    const retryAfterSeconds = Math.ceil(remainingMs / 1000);
    
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      remainingMs
    });

    res.set({
      'Retry-After': retryAfterSeconds,
      'X-RateLimit-Limit': RATE_LIMIT.maxRequests,
      'X-RateLimit-Remaining': 0,
      'X-RateLimit-Reset': new Date(Date.now() + remainingMs)
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: retryAfterSeconds,
      limit: RATE_LIMIT.maxRequests,
      windowMs: RATE_LIMIT.windowMs
    });
  }
};

module.exports = rateLimiterMiddleware;