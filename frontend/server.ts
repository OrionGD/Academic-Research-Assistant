import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3033;
const BACKEND_PROXY = 'http://127.0.0.1:2022';
const DB_PATH = path.resolve(__dirname, 'research.db');
const UPLOAD_DIR = path.resolve(__dirname, 'uploads');

console.log('\n============================================================');
console.log('🚀 ScholarAI Gateway Server Starting...');
console.log(`📅 Time: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${ENV}`);
console.log('============================================================\n');

console.log('📦 Initializing SQLite database...');
const db = new Database(DB_PATH);
console.log(`✅ Database connected: research.db`);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    year INTEGER NOT NULL,
    uploadDate TEXT NOT NULL,
    abstract TEXT,
    keywords TEXT,
    status TEXT NOT NULL,
    fileUrl TEXT NOT NULL,
    userId TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    displayName TEXT,
    photoURL TEXT,
    role TEXT DEFAULT 'user',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    totalDocuments INTEGER DEFAULT 0,
    apiRequestsLast24h INTEGER DEFAULT 0,
    activeUsersToday INTEGER DEFAULT 0
  );
`);
console.log('✅ Tables verified/created successfully');

// Seed metrics if empty
const metricsCount = db.prepare('SELECT COUNT(*) as count FROM metrics').get() as { count: number };
if (metricsCount.count === 0) {
  db.prepare('INSERT INTO metrics (totalDocuments, apiRequestsLast24h, activeUsersToday) VALUES (0, 0, 0)').run();
}

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`📁 Uploads directory created`);
} else {
  console.log(`📁 Uploads directory exists`);
}

const app = express();

/**
 * PROXY MIDDLEWARE
 * Forwards /api requests to the Python backend (FastAPI).
 * Supports SSE (Server-Sent Events) for AI streaming.
 */
app.use('/api', createProxyMiddleware({
  target: BACKEND_PROXY,
  changeOrigin: true,
  pathRewrite: {
    // Keep the /api prefix as the backend expects it
    // '^/api': '/api' 
  },
  onProxyReq: (proxyReq, req, res) => {
    // Ensure host header is set correctly for the backend
    proxyReq.setHeader('host', '127.0.0.1:2022');
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(502).json({ error: 'Gateway failed to reach backend service.' });
  }
}));

app.use(express.json());
const upload = multer({ dest: UPLOAD_DIR });

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// Vite Integration
async function startServer() {
  if (ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('/*any', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n============================================================');
    console.log('✅ Application Started Successfully!');
    console.log(`🚀 Server URL: http://localhost:${PORT}`);
    console.log(`📡 Backend Proxy: ${BACKEND_PROXY}`);
    console.log(`📂 Upload Directory: ${UPLOAD_DIR}`);
    console.log(`🛢️  Database: research.db`);
    console.log(`🌐 Mode: ${ENV}`);
    console.log('============================================================\n');
  });
}

startServer();
