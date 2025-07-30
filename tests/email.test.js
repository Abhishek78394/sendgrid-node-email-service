const request = require('supertest');
const app = require('../src/app');

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn()
}));

const sgMail = require('@sendgrid/mail');

describe('Email API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/email/send', () => {
    it('should send email successfully', async () => {
      sgMail.send.mockResolvedValue([{
        statusCode: 202,
        headers: { 'x-message-id': 'test-message-id' }
      }]);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'Test content',
        html: '<p>Test content</p>'
      };

      const response = await request(app)
        .post('/api/email/send')
        .send(emailData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email sent successfully');
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [emailData.to],
          subject: emailData.subject,
          text: emailData.text,
          html: emailData.html
        })
      );
    });

    it('should validate email data', async () => {
      const invalidEmailData = {
        to: 'invalid-email',
        subject: '',
        text: ''
      };

      const response = await request(app)
        .post('/api/email/send')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should handle SendGrid errors', async () => {
      sgMail.send.mockRejectedValue({
        code: 401,
        message: 'Unauthorized',
        response: { body: { errors: ['Invalid API key'] } }
      });

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'Test content'
      };

      const response = await request(app)
        .post('/api/email/send')
        .send(emailData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/email/send-template', () => {
    it('should send template email successfully', async () => {
      sgMail.send.mockResolvedValue([{
        statusCode: 202,
        headers: { 'x-message-id': 'test-message-id' }
      }]);

      const templateData = {
        to: 'test@example.com',
        templateName: 'welcome',
        templateData: {
          name: 'John Doe',
          company: 'Test Company'
        }
      };

      const response = await request(app)
        .post('/api/email/send-template')
        .send(templateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(sgMail.send).toHaveBeenCalled();
    });

    it('should handle invalid template name', async () => {
      const templateData = {
        to: 'test@example.com',
        templateName: 'nonexistent',
        templateData: {}
      };

      const response = await request(app)
        .post('/api/email/send-template')
        .send(templateData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/email/send-bulk', () => {
    it('should send bulk emails successfully', async () => {
      sgMail.send.mockResolvedValue([
        { statusCode: 202, headers: { 'x-message-id': 'msg-1' } },
        { statusCode: 202, headers: { 'x-message-id': 'msg-2' } }
      ]);

      const bulkData = {
        recipients: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' }
        ],
        subject: 'Bulk Email Test',
        templateName: 'newsletter',
        templateData: { content: 'Newsletter content' }
      };

      const response = await request(app)
        .post('/api/email/send-bulk')
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sentCount).toBe(2);
    });

    it('should validate bulk email data', async () => {
      const invalidBulkData = {
        recipients: [], // Empty array
        subject: 'Test'
      };

      const response = await request(app)
        .post('/api/email/send-bulk')
        .send(invalidBulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});