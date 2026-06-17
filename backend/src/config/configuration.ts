import * as fs from 'fs';
import * as path from 'path';

function getWritablePath(targetPath: string, fallbackPath: string): string {
  try {
    const dir = path.extname(targetPath) ? path.dirname(targetPath) : targetPath;
    fs.mkdirSync(dir, { recursive: true });
    
    // Test write permission
    const testFile = path.join(dir, '.write-test-' + Date.now());
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    return targetPath;
  } catch (error) {
    console.warn(`[Storage Config] Path "${targetPath}" is not writable. Falling back to "${fallbackPath}". Error:`, error.message);
    try {
      const fallbackDir = path.extname(fallbackPath) ? path.dirname(fallbackPath) : fallbackPath;
      fs.mkdirSync(fallbackDir, { recursive: true });
    } catch (e) {}
    return fallbackPath;
  }
}

export default () => {
  const defaultDb = './storage/excel_web.sqlite';
  const defaultUploads = './storage/uploads';
  const defaultGenerated = './storage/generated';

  const dbPath = getWritablePath(process.env.DB_DATABASE || defaultDb, defaultDb);
  const uploadsPath = getWritablePath(process.env.UPLOADS_DIR || defaultUploads, defaultUploads);
  const generatedPath = getWritablePath(process.env.GENERATED_DIR || defaultGenerated, defaultGenerated);

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    database: {
      type: process.env.DB_TYPE || 'better-sqlite3',
      database: dbPath,
    },
    storage: {
      uploadsDir: uploadsPath,
      generatedDir: generatedPath,
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    },
  };
};

