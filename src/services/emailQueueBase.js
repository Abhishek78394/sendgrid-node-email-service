
const logger = require('../utils/logger');

class EmailQueueBase {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchSize = 100; 
    this.processInterval = 1000; 
    this.maxRetries = 3;
    
    this.startProcessor();
  }

 
  addToQueue(emails, priority = 'normal') {
    const queueItem = {
      id: this.generateId(),
      emails: Array.isArray(emails) ? emails : [emails],
      priority,
      attempts: 0,
      createdAt: new Date(),
      status: 'pending'
    };

    if (priority === 'high') {
      this.queue.unshift(queueItem);
    } else {
      this.queue.push(queueItem);
    }

    logger.info(`📧 Added ${queueItem.emails.length} emails to queue`, {
      queueId: queueItem.id,
      priority,
      queueSize: this.queue.length
    });

    return queueItem.id;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      const batch = this.queue.splice(0, this.batchSize);
      
      for (const queueItem of batch) {
        try {
          queueItem.status = 'processing';
          await this.processQueueItem(queueItem);
          queueItem.status = 'completed';
          
          logger.info(`✅ Queue item processed successfully`, {
            queueId: queueItem.id,
            emailCount: queueItem.emails.length
          });
        } catch (error) {
          queueItem.attempts++;
          queueItem.status = 'failed';
          queueItem.lastError = error.message;

          if (queueItem.attempts < this.maxRetries) {
            queueItem.status = 'retry';
            this.queue.push(queueItem);
            
            logger.warn(`🔄 Retrying queue item`, {
              queueId: queueItem.id,
              attempt: queueItem.attempts,
              error: error.message
            });
          } else {
            logger.error(`❌ Queue item failed after max retries`, {
              queueId: queueItem.id,
              attempts: queueItem.attempts,
              error: error.message
            });
            
            this.handleFailedItem(queueItem);
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  async processQueueItem(queueItem) {
    throw new Error('processQueueItem must be implemented by EmailService');
  }

  handleFailedItem(queueItem) {
    logger.error('Failed queue item moved to dead letter queue', {
      queueId: queueItem.id,
      emails: queueItem.emails.length
    });
  }

  startProcessor() {
    setInterval(() => {
      this.processQueue().catch(error => {
        logger.error('Queue processing error:', error);
      });
    }, this.processInterval);

    logger.info('📨 Email queue processor started');
  }

  getStats() {
    const stats = {
      queueSize: this.queue.length,
      processing: this.processing,
      batchSize: this.batchSize,
      statusCounts: {}
    };

    this.queue.forEach(item => {
      stats.statusCounts[item.status] = (stats.statusCounts[item.status] || 0) + 1;
    });

    return stats;
  }

  generateId() {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = EmailQueueBase;
