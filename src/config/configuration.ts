export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongodbUri: process.env.MONGODB_URI ?? '',
  mongodbDatabase: process.env.MONGODB_DATABASE ?? 'gestora',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  setupSecret: process.env.SETUP_SECRET ?? '',
});
