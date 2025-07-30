const Joi = require('joi');

const bulkEmailWithCacheSchema = Joi.object({
  recipients: Joi.array().items(Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string(),
    id: Joi.string(),
    customData: Joi.object()
  })).min(1).max(10000).required(),
  subject: Joi.string().min(1).max(200),
  templateName: Joi.string(),
  templateData: Joi.object().default({}),
  useQueue: Joi.boolean().default(true),
  priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
  batchSize: Joi.number().integer().min(1).max(1000)
}).xor('subject', 'templateName'); 

const warmUpCacheSchema = Joi.object({
  templateNames: Joi.array().items(Joi.string()),
  templateData: Joi.object().default({})
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
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
  validateBulkEmailWithCache: validate(bulkEmailWithCacheSchema),
  validateWarmUpCache: validate(warmUpCacheSchema)
};
