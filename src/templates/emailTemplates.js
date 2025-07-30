class EmailTemplates {
  constructor() {
    this.templates = {
      welcome: {
        subject: 'Welcome to {{company}}!',
        text: `Hi {{name}},

Welcome to {{company}}! We're excited to have you on board.

Best regards,
The {{company}} Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to {{company}}!</h1>
            <p>Hi {{name}},</p>
            <p>Welcome to {{company}}! We're excited to have you on board.</p>
            <p>Best regards,<br>The {{company}} Team</p>
          </div>
        `
      },

      newsletter: {
        subject: '{{company}} Newsletter - {{month}} {{year}}',
        text: `Hi {{name}},

Here's your {{company}} newsletter for {{month}} {{year}}.

{{content}}

Best regards,
The {{company}} Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">{{company}} Newsletter</h1>
            <p>Hi {{name}},</p>
            <p>Here's your {{company}} newsletter for {{month}} {{year}}.</p>
            <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px;">
              {{content}}
            </div>
            <p>Best regards,<br>The {{company}} Team</p>
          </div>
        `
      },

      passwordReset: {
        subject: 'Password Reset Request',
        text: `Hi {{name}},

You requested a password reset. Click the link below to reset your password:
{{resetLink}}

This link expires in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
The {{company}} Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Password Reset Request</h1>
            <p>Hi {{name}},</p>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetLink}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </div>
            <p><small>This link expires in 1 hour.</small></p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>The {{company}} Team</p>
          </div>
        `
      }
    };
  }

  getTemplate(templateName, data = {}) {
    const template = this.templates[templateName];
    if (!template) {
      return null;
    }

    const defaultData = {
      company: 'Your Company',
      name: 'User',
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
      ...data
    };

    return {
      subject: this._replaceVariables(template.subject, defaultData),
      text: this._replaceVariables(template.text, defaultData),
      html: this._replaceVariables(template.html, defaultData)
    };
  }

  _replaceVariables(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  addTemplate(name, template) {
    this.templates[name] = template;
  }

  getTemplateNames() {
    return Object.keys(this.templates);
  }
}

module.exports = new EmailTemplates();