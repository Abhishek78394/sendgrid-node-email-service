const emailService = require('../services/emailService');
const logger = require('../utils/logger');

class EmailController {
  /**
   * Send simple email
   */
  async sendEmail(req, res, next) {
    try {
      const { to, subject, text, html, attachments } = req.body;

      const result = await emailService.sendEmail({
        to,
        subject,
        text,
        html,
        attachments
      });

      res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send template email
   */
  async sendTemplateEmail(req, res, next) {
    try {
      const { to, templateName, templateData, subject } = req.body;

      const result = await emailService.sendTemplateEmail({
        to,
        templateName,
        templateData,
        subject
      });

      res.status(200).json({
        success: true,
        message: 'Template email sent successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(req, res, next) {
    try {
      const { recipients, subject, templateName, templateData } = req.body;

      const result = await emailService.sendBulkEmails({
        recipients,
        subject,
        templateName,
        templateData
      });

      res.status(200).json({
        success: true,
        message: 'Bulk emails sent successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send dynamic template email
   */
  async sendDynamicTemplate(req, res, next) {
    try {
      const { to, templateId, dynamicTemplateData } = req.body;

      const result = await emailService.sendDynamicTemplate({
        to,
        templateId,
        dynamicTemplateData
      });

      res.status(200).json({
        success: true,
        message: 'Dynamic template email sent successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmailController();