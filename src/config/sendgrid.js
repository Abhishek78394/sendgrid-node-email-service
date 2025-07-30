const sgMail = require('@sendgrid/mail');
const { SENDGRID_API_KEY, SENDGRID_VERIFIED_SENDER } = require('./environment');
const logger = require('../utils/logger');

sgMail.setApiKey(SENDGRID_API_KEY);

const testConnection = async () => {
  try {
    const testMessage = {
      to: 'abhi78394@gmail.com',
      from: SENDGRID_VERIFIED_SENDER,
      subject: 'SendGrid Connection Test',
      text: 'This is a test message',
      mailSettings: {
        sandboxMode: { enable: true }
      }
    };

    await sgMail.send(testMessage);
    logger.info('SendGrid connection test successful');
    return true;
  } catch (error) {
    if (error.code === 400 && error.message.includes('sandbox')) {
      logger.info('SendGrid API key validated (sandbox mode)');
      return true;
    }
    
    logger.error('SendGrid connection test failed:', {
      error: error.message,
      code: error.code
    });
    throw new Error(`SendGrid configuration error: ${error.message}`);
  }
};

if (process.env.NODE_ENV !== 'test') {
  testConnection().catch(error => {
    logger.error('Failed to initialize SendGrid:', error.message);
    process.exit(1);
  });
}

module.exports = sgMail;