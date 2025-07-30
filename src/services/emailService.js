const sgMail = require('../config/sendgrid');
const { SENDGRID_VERIFIED_SENDER } = require('../config/environment');
const logger = require('../utils/logger');
const emailTemplates = require('../templates/emailTemplates');

class EmailService {
  constructor() {
    this.defaultFrom = SENDGRID_VERIFIED_SENDER;
  }

  async sendEmail({ to, subject, text, html, from = null, attachments = null }) {
    try {
      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: from || this.defaultFrom,
        subject,
        text,
        html,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      };

      if (attachments && attachments.length > 0) {
        msg.attachments = attachments;
      }

      const response = await sgMail.send(msg);
      
      logger.info('Email sent successfully', {
        to: msg.to,
        subject: msg.subject,
        messageId: response[0].headers['x-message-id']
      });

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        statusCode: response[0].statusCode
      };
    } catch (error) {
      logger.error('Failed to send email:', {
        error: error.message,
        code: error.code,
        to,
        subject
      });
      throw this._handleSendGridError(error);
    }
  }

  async sendTemplateEmail({ to, templateName, templateData, subject = null, from = null }) {
    try {
      const template = emailTemplates.getTemplate(templateName, templateData);
      
      if (!template) {
        throw new Error(`Template "${templateName}" not found`);
      }

      return await this.sendEmail({
        to,
        subject: subject || template.subject,
        text: template.text,
        html: template.html,
        from
      });
    } catch (error) {
      logger.error('Failed to send template email:', {
        error: error.message,
        templateName,
        to
      });
      throw error;
    }
  }

  async sendBulkEmails({ recipients, subject, templateName = null, templateData = {}, from = null }) {
    try {
      const messages = recipients.map(recipient => {
        let emailContent;
        
        if (templateName) {
          const template = emailTemplates.getTemplate(templateName, {
            ...templateData,
            name: recipient.name || recipient.email
          });
          emailContent = {
            text: template.text,
            html: template.html,
            subject: subject || template.subject
          };
        } else {
          emailContent = {
            text: templateData.text || '',
            html: templateData.html || '',
            subject
          };
        }

        return {
          to: recipient.email,
          from: from || this.defaultFrom,
          ...emailContent,
          customArgs: {
            recipient_id: recipient.id || recipient.email
          }
        };
      });

      const response = await sgMail.send(messages);
      
      logger.info('Bulk emails sent successfully', {
        count: recipients.length,
        subject
      });

      return {
        success: true,
        sentCount: recipients.length,
        responses: response.map(r => ({
          messageId: r.headers['x-message-id'],
          statusCode: r.statusCode
        }))
      };
    } catch (error) {
      logger.error('Failed to send bulk emails:', {
        error: error.message,
        recipientCount: recipients.length
      });
      throw this._handleSendGridError(error);
    }
  }

  async sendDynamicTemplate({ to, templateId, dynamicTemplateData, from = null }) {
    try {
      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: from || this.defaultFrom,
        templateId,
        dynamicTemplateData
      };

      const response = await sgMail.send(msg);
      
      logger.info('Dynamic template email sent successfully', {
        to: msg.to,
        templateId,
        messageId: response[0].headers['x-message-id']
      });

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        statusCode: response[0].statusCode
      };
    } catch (error) {
      logger.error('Failed to send dynamic template email:', {
        error: error.message,
        templateId,
        to
      });
      throw this._handleSendGridError(error);
    }
  }

  _handleSendGridError(error) {
    const errorMap = {
      400: 'Bad Request - Invalid email data',
      401: 'Unauthorized - Invalid API key',
      403: 'Forbidden - Insufficient permissions',
      413: 'Payload Too Large - Email too large',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - SendGrid issue',
      502: 'Bad Gateway - SendGrid temporarily unavailable',
      503: 'Service Unavailable - SendGrid maintenance'
    };

    const customError = new Error(errorMap[error.code] || error.message);
    customError.statusCode = error.code >= 400 && error.code < 500 ? error.code : 500;
    customError.isOperational = true;
    
    if (error.response && error.response.body && error.response.body.errors) {
      customError.details = error.response.body.errors;
    }

    return customError;
  }
}

module.exports = new EmailService();