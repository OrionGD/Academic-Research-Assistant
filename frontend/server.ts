import express from 'express';
import { createServer as createViteServer } from 'vite';
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
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// API Routes
app.get('/api/admin/metrics', (req, res) => {
  const metrics = db.prepare('SELECT * FROM metrics ORDER BY id DESC LIMIT 1').get();
  res.json(metrics);
});

app.get('/api/admin/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.delete('/api/admin/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

app.get('/api/documents', (req, res) => {
  const documents = db.prepare('SELECT * FROM documents ORDER BY uploadDate DESC').all();
  // Parse authors and keywords from strings back to arrays
  const parsedDocs = documents.map((doc: any) => ({
    ...doc,
    authors: JSON.parse(doc.authors),
    keywords: JSON.parse(doc.keywords || '[]')
  }));
  res.json(parsedDocs);
});

app.post('/api/documents/upload', upload.single('file'), (req, res) => {
  const { metadata } = req.body;
  const parsedMetadata = metadata ? JSON.parse(metadata) : {};
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const documentId = Math.random().toString(36).substring(2, 15);
  const newDoc = {
    id: documentId,
    title: parsedMetadata.title || file.originalname,
    authors: JSON.stringify(parsedMetadata.authors ? (Array.isArray(parsedMetadata.authors) ? parsedMetadata.authors : parsedMetadata.authors.split(',').map((s: string) => s.trim())) : []),
    year: parsedMetadata.year || new Date().getFullYear(),
    uploadDate: new Date().toISOString(),
    abstract: parsedMetadata.abstract || '',
    keywords: JSON.stringify(parsedMetadata.keywords ? (Array.isArray(parsedMetadata.keywords) ? parsedMetadata.keywords : parsedMetadata.keywords.split(',').map((s: string) => s.trim())) : []),
    status: 'completed',
    fileUrl: `/uploads/${file.filename}`,
    userId: 'user-1' // Mock user ID
  };

  db.prepare(`
    INSERT INTO documents (id, title, authors, year, uploadDate, abstract, keywords, status, fileUrl, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newDoc.id,
    newDoc.title,
    newDoc.authors,
    newDoc.year,
    newDoc.uploadDate,
    newDoc.abstract,
    newDoc.keywords,
    newDoc.status,
    newDoc.fileUrl,
    newDoc.userId
  );

  // Update metrics
  db.prepare('UPDATE metrics SET totalDocuments = totalDocuments + 1').run();

  res.json({
    ...newDoc,
    authors: JSON.parse(newDoc.authors),
    keywords: JSON.parse(newDoc.keywords)
  });
});

app.get('/api/documents/:id', (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
  if (!doc) {
    return res.status(404).json({ message: 'Document not found' });
  }
  res.json({
    ...doc,
    authors: JSON.parse(doc.authors),
    keywords: JSON.parse(doc.keywords || '[]')
  });
});

app.delete('/api/documents/:id', (req, res) => {
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  db.prepare('UPDATE metrics SET totalDocuments = MAX(0, totalDocuments - 1)').run();
  res.status(204).send();
});

app.post('/api/search/semantic', (req, res) => {
  const { query } = req.body;
  const documents = db.prepare('SELECT * FROM documents WHERE title LIKE ? OR abstract LIKE ?').all(`%${query}%`, `%${query}%`);
  const results = documents.map((doc: any) => ({
    documentId: doc.id,
    title: doc.title,
    snippet: doc.abstract ? doc.abstract.substring(0, 150) + '...' : 'No abstract available',
    relevanceScore: 0.95,
    authors: JSON.parse(doc.authors),
    year: doc.year
  }));
  res.json(results);
});

app.post('/api/chat/message', (req, res) => {
  const { message } = req.body;
  res.json({
    message: {
      id: Math.random().toString(36).substring(2, 15),
      role: 'assistant',
      content: `I've received your message: "${message}". As an AI research assistant, I can help you analyze your papers.`,
      timestamp: new Date().toISOString()
    },
    suggestedQuestions: ['What are the key findings?', 'Summarize the methodology', 'Compare with other papers']
  });
});

app.get('/api/chat/history', (req, res) => {
  res.json([]);
});

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
