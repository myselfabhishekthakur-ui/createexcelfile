export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  database: {
    type: process.env.DB_TYPE || 'better-sqlite3',
    database: process.env.DB_DATABASE || './storage/excel_web.sqlite',
  },
  storage: {
    uploadsDir: process.env.UPLOADS_DIR || './storage/uploads',
    generatedDir: process.env.GENERATED_DIR || './storage/generated',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});
