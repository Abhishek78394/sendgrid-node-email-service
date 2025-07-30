const enhancedEmailService = require('../services/queuedEmailService');
const logger = require('../utils/logger');

class QueuedEmailController {
  async sendBulkEmailsWithCache(req, res, next) {
    try {
      const { 
        recipients, 
        subject, 
        templateName, 
        templateData = {},
        useQueue = true,
        priority = 'normal',
        batchSize
      } = req.body;

      const result = await enhancedEmailService.sendBulkEmailsWithCache({
        recipients,
        subject,
        templateName,
        templateData,
        useQueue,
        priority,
        batchSize
      });

      const statusCode = result.queued ? 202 : 200;
      
      res.status(statusCode).json({
        success: true,
        message: result.queued 
          ? 'Bulk emails queued for processing'
          : 'Bulk emails sent successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

 
  async getQueueStats(req, res, next) {
    try {
      const queueStats = enhancedEmailService.getStats();
      const cacheStats = enhancedEmailService.getCacheStats();

      res.status(200).json({
        success: true,
        data: {
          queue: queueStats,
          cache: cacheStats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

 
  async clearCache(req, res, next) {
    try {
      enhancedEmailService.clearTemplateCache();
      
      res.status(200).json({
        success: true,
        message: 'Template cache cleared successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  
  async warmUpCache(req, res, next) {
    try {
      const { templateNames, templateData } = req.body;
      
      await enhancedEmailService.warmUpTemplateCache(templateNames, templateData);
      
      res.status(200).json({
        success: true,
        message: 'Template cache warmed up successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QueuedEmailController();
