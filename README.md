# SendGrid Email Service

A production-ready Node.js email service using SendGrid with comprehensive features including rate limiting, validation, templating, and error handling.

## Features

- ✅ **SendGrid Integration**: Full SendGrid API integration
- ✅ **Input Validation**: Joi schema validation
- ✅ **Rate Limiting**: Prevent API abuse
- ✅ **Security**: Helmet for security headers
- ✅ **Email Templates**: Built-in template system
- ✅ **Bulk Emails**: Efficient bulk email sending
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Logging**: Structured logging system
- ✅ **Testing**: Unit and integration tests
- ✅ **Production Ready**: Docker support, environment configs

## Quick Start

### 1. Installation

```bash
git clone https://github.com/Abhishek78394/sendgrid-node-email-service.git
cd sendgrid-email-service
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your SendGrid credentials:

```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_VERIFIED_SENDER=your-verified-email@domain.com
```

### 3. Run the Application

```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

### Send Simple Email

```http
POST /api/email/send
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Hello World",
  "text": "Plain text content",
  "html": "<h1>HTML content</h1>"
}
```

### Send Template Email

```http
POST /api/email/send-template
Content-Type: application/json

{
  "to": "recipient@example.com",
  "templateName": "welcome",
  "templateData": {
    "name": "John Doe",
    "company": "Acme Corp"
  }
}
```

### Send Bulk Emails

```http
POST /api/email/send-bulk
Content-Type: application/json

{
  "recipients": [
    {"email": "user1@example.com", "name": "User 1"},
    {"email": "user2@example.com", "name": "User 2"}
  ],
  "subject": "Newsletter",
  "templateName": "newsletter",
  "templateData": {"content": "Latest updates..."}
}
```

## Built-in Templates

- `welcome`: Welcome email template
- `newsletter`: Newsletter template  
- `passwordReset`: Password reset template

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Production Deployment

### Environment Variables

```env
NODE_ENV=production
SENDGRID_API_KEY=your_production_api_key
SENDGRID_VERIFIED_SENDER=noreply@yourdomain.com
PORT=3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Architecture

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── routes/          # Express routes
├── services/        # Business logic
├── templates/       # Email templates
├── utils/           # Utility functions
└── app.js          # Express app setup
```

## Error Handling

The service includes comprehensive error handling:

- **Validation Errors**: 400 status with detailed field errors
- **SendGrid Errors**: Mapped to appropriate HTTP status codes
- **Rate Limiting**: 429 status with retry information
- **Server Errors**: 500 status with sanitized error messages

## Monitoring

- Structured JSON logging
- Request/response logging
- Error tracking with stack traces
- Performance metrics

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API abuse prevention
- **Input Validation**: XSS and injection prevention
- **Environment Variables**: Secure credential management