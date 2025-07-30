const sgMail = require('../config/sendgrid');
const { SENDGRID_VERIFIED_SENDER } = require('../config/environment');
const logger = require('../utils/logger');
const emailTemplates = require('../templates/emailTemplates');
const cacheService = require('./cacheService');
const EmailQueueBase = require('./emailQueueBase');

class QueuedEmailService extends EmailQueueBase {
  constructor() {
    super();
    this.defaultFrom = SENDGRID_VERIFIED_SENDER;
    this.templateCache = new Map();
    this.recipientBatchSize = 1000; 
  }

 
  async processQueueItem(queueItem) {
    const results = [];
    
    for (const email of queueItem.emails) {
      try {
        const result = await this.sendSingleEmail(email);
        results.push(result);
      } catch (error) {
        logger.error('Failed to send email in queue:', {
          queueId: queueItem.id,
          email: email.to,
          error: error.message
        });
        throw error;
      }
    }
    
    return results;
  }

 
  async sendBulkEmailsWithCache({ 
    recipients, 
    subject, 
    templateName = null, 
    templateData = {}, 
    from = null,
    useQueue = true,
    priority = 'normal',
    batchSize = null 
  }) {
    try {
      logger.info(`Starting bulk email send`, {
        recipientCount: recipients.length,
        templateName,
        useQueue
      });

      let templateContent = null;
      if (templateName) {
        const templateCacheKey = `template_${templateName}_${JSON.stringify(templateData)}`;
        
        templateContent = cacheService.get(templateCacheKey);
        
        if (!templateContent) {
          logger.info(`Template not in cache, generating: ${templateName}`);
          const template = emailTemplates.getTemplate(templateName, templateData);
          
          if (!template) {
            throw new Error(`Template "${templateName}" not found`);
          }
          
          templateContent = template;
          cacheService.set(templateCacheKey, templateContent, 600000);
          logger.info(`Template cached: ${templateName}`);
        } else {
          logger.info(`Template loaded from cache: ${templateName}`);
        }
      }

      const batches = this.createRecipientBatches(recipients, batchSize || this.recipientBatchSize);
      
      if (useQueue) {
        return await this.queueBulkEmails({
          batches,
          subject,
          templateContent,
          templateData,
          from,
          priority
        });
      } else {
        return await this.sendBulkEmailsDirectly({
          batches,
          subject,
          templateContent,
          templateData,
          from
        });
      }

    } catch (error) {
      logger.error('Bulk email send failed:', {
        error: error.message,
        recipientCount: recipients.length
      });
      throw error;
    }
  }

 
  async queueBulkEmails({ batches, subject, templateContent, templateData, from, priority }) {
    const queueIds = [];
    
    for (const batch of batches) {
      const emails = batch.map(recipient => this.createEmailMessage({
        recipient,
        subject,
        templateContent,
        templateData,
        from
      }));
      
      const queueId = this.addToQueue(emails, priority);
      queueIds.push(queueId);
    }

    logger.info(`📨 Bulk emails queued`, {
      batchCount: batches.length,
      queueIds: queueIds.length
    });

    return {
      success: true,
      queued: true,
      batchCount: batches.length,
      queueIds,
      estimatedProcessingTime: this.estimateProcessingTime(batches.length)
    };
  }

  
  async sendBulkEmailsDirectly({ batches, subject, templateContent, templateData, from }) {
    const results = [];
    let totalSent = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      logger.info(`Sending batch ${i + 1}/${batches.length}`, {
        batchSize: batch.length
      });

      try {
        const messages = batch.map(recipient => this.createEmailMessage({
          recipient,
          subject,
          templateContent,
          templateData,
          from
        }));

        const response = await sgMail.send(messages);
        
        const batchResult = {
          batchIndex: i,
          sent: batch.length,
          responses: response.map(r => ({
            messageId: r.headers['x-message-id'],
            statusCode: r.statusCode
          }))
        };
        
        results.push(batchResult);
        totalSent += batch.length;
        
        if (i < batches.length - 1) {
          await this.delay(100);
        }
        
      } catch (error) {
        logger.error(`Batch ${i + 1} failed:`, {
          error: error.message,
          batchSize: batch.length
        });
        
        results.push({
          batchIndex: i,
          sent: 0,
          error: error.message
        });
      }
    }

    logger.info(`Bulk email send completed`, {
      totalSent,
      batchCount: batches.length,
      successfulBatches: results.filter(r => !r.error).length
    });

    return {
      success: true,
      queued: false,
      totalSent,
      batchCount: batches.length,
      results
    };
  }


  createEmailMessage({ recipient, subject, templateContent, templateData, from }) {
    let emailSubject = subject;
    let emailText = '';
    let emailHtml = '';

    if (templateContent) {
      const recipientData = {
        ...templateData,
        name: recipient.name || recipient.email,
        email: recipient.email,
        ...recipient.customData
      };

      emailSubject = subject || this.replaceVariables(templateContent.subject, recipientData);
      emailText = this.replaceVariables(templateContent.text, recipientData);
      emailHtml = this.replaceVariables(templateContent.html, recipientData);
    } else {
      emailText = templateData.text || '';
      emailHtml = templateData.html || '';
    }

    return {
      to: recipient.email,
      from: from || this.defaultFrom,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      customArgs: {
        recipient_id: recipient.id || recipient.email,
        batch_id: Date.now().toString()
      },
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    };
  }


  createRecipientBatches(recipients, batchSize) {
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }
    
    logger.info(`Created ${batches.length} batches`, {
      totalRecipients: recipients.length,
      batchSize,
      lastBatchSize: batches[batches.length - 1]?.length || 0
    });
    
    return batches;
  }

  async sendSingleEmail(emailData) {
    const response = await sgMail.send(emailData);
    
    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode,
      to: emailData.to
    };
  }


  replaceVariables(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  estimateProcessingTime(batchCount) {
    const estimatedSeconds = batchCount * 1.5;
    return `${Math.ceil(estimatedSeconds)} seconds`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  getCacheStats() {
    return cacheService.getStats();
  }

  clearTemplateCache() {
    cacheService.clear();
    logger.info('Template cache cleared');
    return true;
  }


  async warmUpTemplateCache(templateNames = [], commonTemplateData = {}) {
    logger.info('Warming up template cache');
    
    const availableTemplates = templateNames.length > 0 
      ? templateNames 
      : emailTemplates.getTemplateNames();

    for (const templateName of availableTemplates) {
      try {
        const cacheKey = `template_${templateName}_${JSON.stringify(commonTemplateData)}`;
        
        if (!cacheService.has(cacheKey)) {
          const template = emailTemplates.getTemplate(templateName, commonTemplateData);
          if (template) {
            cacheService.set(cacheKey, template, 600000); // 10 minutes
            logger.info(`Template pre-cached: ${templateName}`);
          }
        }
      } catch (error) {
        logger.warn(`Failed to warm up template ${templateName}:`, error.message);
      }
    }
    
    logger.info('Template cache warm-up completed');
  }
}

module.exports = new QueuedEmailService();