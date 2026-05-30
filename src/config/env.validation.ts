import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().required(),
  MONGODB_DATABASE: Joi.string().default('gestora'),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').optional(),
  CLOUDINARY_API_KEY: Joi.string().allow('').optional(),
  CLOUDINARY_API_SECRET: Joi.string().allow('').optional(),
  SETUP_SECRET: Joi.string().allow('').optional(),
  EXPO_ACCESS_TOKEN: Joi.string().allow('').optional(),
  NOTIFICATION_CRON_ENABLED: Joi.string().valid('true', 'false').default('true'),
  NOTIFICATION_DUE_SOON_HOURS: Joi.number().default(48),
  RESEND_API_KEY: Joi.string().allow('').optional(),
  EMAIL_FROM: Joi.string().allow('').optional(),
  APP_NAME: Joi.string().default('Gestora'),
});
