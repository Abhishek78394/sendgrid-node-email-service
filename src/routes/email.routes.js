const express = require('express');
const emailController = require('../controllers/emailController');
const rateLimiter = require('../middleware/rateLimiter');
const {
  validateEmail,
  validateTemplateEmail,
  validateBulkEmail,
  validateDynamicTemplate
} = require('../utils/validation/validation');

const router = express.Router();

router.use(rateLimiter);

router.post('/send', validateEmail, emailController.sendEmail);
router.post('/send-template', validateTemplateEmail, emailController.sendTemplateEmail);
router.post('/send-bulk', validateBulkEmail, emailController.sendBulkEmails);
router.post('/send-dynamic-template', validateDynamicTemplate, emailController.sendDynamicTemplate);

module.exports = router;