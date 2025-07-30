const express = require('express');
const enhancedEmailController = require('../controllers/queuedEmailController ');
const rateLimiter = require('../middleware/rateLimiter');
const { validateBulkEmailWithCache, validateWarmUpCache } = require('../utils/validation/bulkEmailValidation');

const router = express.Router();

router.use(rateLimiter);

router.post('/send-bulk-cached', validateBulkEmailWithCache, enhancedEmailController.sendBulkEmailsWithCache);

router.get('/stats', enhancedEmailController.getQueueStats);
router.post('/cache/clear', enhancedEmailController.clearCache);
router.post('/cache/warmup', validateWarmUpCache, enhancedEmailController.warmUpCache);

module.exports = router;