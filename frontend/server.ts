import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ClientRequest, IncomingMessage, ServerResponse } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT || 3033);
const BACKEND_PROXY = 'http://127.0.0.1:2022';
const DB_PATH = path.resolve(__dirname, 'research.db');
const UPLOAD_DIR = path.resolve(__dirname, 'uploads');

const LOG_PREFIX = '[Gateway]';

console.log('\n============================================================');
console.log('🚀 ScholarAI Gateway Server Starting...');
console.log(`📅 Time: ${new Date().toLocaleString()}`);
console.log(`🌍 Environment: ${ENV}`);
console.log('============================================================\n');

console.log(`${LOG_PREFIX} 📦 Initializing SQLite database...`);
try {
  const db = new Database(DB_PATH);
  console.log(`${LOG_PREFIX} ✅ Database connected: research.db`);

  // Initialize database
  console.log(`${LOG_PREFIX} 🔨 Verifying database schema...`);
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
  
  // Seed metrics if empty
  const metricsResult = db.prepare('SELECT COUNT(*) as count FROM metrics').get() as { count: number };
  if (metricsResult.count === 0) {
    db.prepare('INSERT INTO metrics (totalDocuments, apiRequestsLast24h, activeUsersToday) VALUES (0, 0, 0)').run();
    console.log(`${LOG_PREFIX} 📊 Initialized metrics table.`);
  }

  const docResult = db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
  console.log(`${LOG_PREFIX} ✅ Schema verified. Documents in local cache: ${docResult.count}`);

} catch (err) {
  console.error(`${LOG_PREFIX} ❌ Database Initialization Error:`, err);
}

// Ensure uploads directory exists
console.log(`${LOG_PREFIX} 📁 Checking storage configuration...`);
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`${LOG_PREFIX} 📁 Created uploads directory at ${UPLOAD_DIR}`);
} else {
  console.log(`${LOG_PREFIX} 📁 Uploads directory verified.`);
}

const app = express();

/**
 * PROXY MIDDLEWARE
 * Forwards /api requests to the Python backend (FastAPI).
 */
console.log(`${LOG_PREFIX} 📡 Setting up API Proxy to ${BACKEND_PROXY}...`);
app.use('/api', createProxyMiddleware({
  target: BACKEND_PROXY,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq: ClientRequest, req: IncomingMessage, res: ServerResponse) => {
      console.log(`${LOG_PREFIX} ➡️  Proxying: ${req.method} ${req.url}`);
      proxyReq.setHeader('host', '127.0.0.1:2022');
    },
    proxyRes: (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) => {
      if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
        console.log(`${LOG_PREFIX} ⚠️  Backend Response: ${proxyRes.statusCode} for ${req.url}`);
      }
    },
    error: (err: Error, req: IncomingMessage, res: ServerResponse | undefined) => {
      console.error(`${LOG_PREFIX} ❌ Proxy Error:`, err.message);
      if (res && 'status' in res) {
        (res as unknown as Response).status(502).json({ error: 'Gateway failed to reach backend service.' });
      }
    }
  }
}));

app.use(express.json());
const upload = multer({ dest: UPLOAD_DIR });

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// Vite Integration
async function startServer() {
  console.log(`${LOG_PREFIX} 🛠️  Initializing Frontend Engine...`);
  
  if (ENV !== 'production') {
    console.log(`${LOG_PREFIX} 🧪 Mode: Development (Vite HMR enabled)`);
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log(`${LOG_PREFIX} ✅ Vite middleware attached.`);
    } catch (err) {
      console.error(`${LOG_PREFIX} ❌ Vite Initialization Failed:`, err);
    }
  } else {
    console.log(`${LOG_PREFIX} 🚀 Mode: Production (Static Assets)`);
    app.use(express.static('dist'));
    app.get('/*any', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n============================================================');
    console.log('✅ SYSTEM READY - ScholarAI Gateway Online');
    console.log(`🌐 Local URL:   http://localhost:${PORT}`);
    console.log(`📡 Backend:     ${BACKEND_PROXY}`);
    console.log(`🛠️  Environment: ${ENV}`);
    console.log(`📂 Cache:       ${DB_PATH}`);
    console.log('============================================================\n');
  });
}

startServer();
