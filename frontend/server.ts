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

const db = new Database('research.db');

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

const app = express();

// Proxy API requests to the Python backend BEFORE body parsing
app.all('/api/*', async (req, res) => {
  const backendTarget = 'http://127.0.0.1:5000';
  const url = `${backendTarget}${req.originalUrl}`;
  
  try {
    const response = await axios({
      method: req.method,
      url: url,
      data: req, // Pipe the raw request stream
      headers: {
        ...req.headers,
        host: '127.0.0.1:5000'
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

const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// --- MOCK API ROUTES REMOVED ---
// Requests to /api will now be handled by Vite Proxy (see vite.config.ts)
// which forwards them to the Python backend at http://localhost:5000

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 5173;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
