import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
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

// Seed mock users if empty
const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (usersCount.count === 0) {
  const now = new Date().toISOString();
  db.prepare('INSERT INTO users (id, email, displayName, role, createdAt) VALUES (?, ?, ?, ?, ?)').run(
    'user-1', 'admin@example.com', 'Admin User', 'admin', now
  );
  db.prepare('INSERT INTO users (id, email, displayName, role, createdAt) VALUES (?, ?, ?, ?, ?)').run(
    'user-2', 'researcher@example.com', 'Jane Researcher', 'user', now
  );
}

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`📁 Uploads directory created`);
} else {
  console.log(`📁 Uploads directory exists`);
}

const app = express();

// Proxy API requests to the Python backend BEFORE body parsing
app.all('/api/*splat', async (req, res) => {
  const url = `${BACKEND_PROXY}${req.originalUrl}`;

  try {
    const response = await axios({
      method: req.method,
      url: url,
      data: req, // Pipe the raw request stream
      headers: {
        ...req.headers,
        host: '127.0.0.1:2022'
      },
      params: req.query,
      validateStatus: () => true,
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // Forward headers
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value as string | string[]);
      }
    });

    res.status(response.status).send(response.data);
  } catch (error: any) {
    console.error(`Proxy error for ${url}:`, error.message);
    res.status(502).json({ error: 'Proxy failed to reach backend', details: error.message });
  }
});

app.use(express.json());

const upload = multer({ dest: UPLOAD_DIR });

// --- MOCK API ROUTES REMOVED ---
// Requests to /api will now be handled by Vite Proxy (see vite.config.ts)
// which forwards them to the Python backend at http://localhost:2022

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
