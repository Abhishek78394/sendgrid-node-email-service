const Joi = require('joi');

const emailSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.string().email().required(),
    Joi.array().items(Joi.string().email()).min(1).required()
  ).required(),
  subject: Joi.string().min(1).max(200).required(),
  text: Joi.string().allow(''),
  html: Joi.string().allow(''),
  attachments: Joi.array().items(Joi.object({
    content: Joi.string().required(),
    filename: Joi.string().required(),
    type: Joi.string(),
    disposition: Joi.string().valid('attachment', 'inline').default('attachment')
  }))
}).or('text', 'html');

const templateEmailSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.string().email().required(),
    Joi.array().items(Joi.string().email()).min(1).required()
  ).required(),
  templateName: Joi.string().required(),
  templateData: Joi.object().default({}),
  subject: Joi.string().min(1).max(200)
});

const bulkEmailSchema = Joi.object({
  recipients: Joi.array().items(Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string(),
    id: Joi.string()
  })).min(1).max(1000).required(),
  subject: Joi.string().min(1).max(200).required(),
  templateName: Joi.string(),
  templateData: Joi.object().default({})
});

const dynamicTemplateSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.string().email().required(),
    Joi.array().items(Joi.string().email()).min(1).required()
  ).required(),
  templateId: Joi.string().required(),
  dynamicTemplateData: Joi.object().required()
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  validateEmail: validate(emailSchema),
  validateTemplateEmail: validate(templateEmailSchema),
  validateBulkEmail: validate(bulkEmailSchema),
  validateDynamicTemplate: validate(dynamicTemplateSchema)
};