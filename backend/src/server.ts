import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { connectDB } from './config/mongodb';
import { initializeFirebase } from './config/firebase';
import { initializeStorage } from './config/storage';
import { logger } from './utils/logger';

// Middleware
import { authMiddleware } from './middleware/authMiddleware';
import { adminMiddleware } from './middleware/adminMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Routes
import documentRoutes from './routes/documentRoutes';
import searchRoutes from './routes/searchRoutes';
import analysisRoutes from './routes/analysisRoutes';
import chatRoutes from './routes/chatRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
// crossOriginOpenerPolicy: "same-origin" — API responses are never top-level documents,
//   but setting this explicitly is defence-in-depth and silences scanner warnings.
// crossOriginEmbedderPolicy: false — disabled; the JSON API does not serve documents
//   that would require COEP, and enabling it would block certain cross-origin resources.
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginEmbedderPolicy: false,
}));

// CORS — restrict to known origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Explicit allowedHeaders ensures Authorization is always permitted in preflight.
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
};

// Handle CORS preflight (OPTIONS) for ALL routes BEFORE auth middleware runs.
// The browser sends OPTIONS before every cross-origin request with custom headers.
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);

// Initialize services
connectDB();
initializeFirebase();
initializeStorage();


// Public API info route — no auth required.
// Must be registered BEFORE authMiddleware so the bare /api path never 401s.
app.get('/api', (_req, res) => {
  res.json({
    name: 'ARAS API',
    version: process.env.npm_package_version || '1.0.0',
    status: 'ok',
    endpoints: ['/api/documents', '/api/search', '/api/analysis', '/api/chat', '/api/admin'],
  });
});

// Apply authentication to all /api/* sub-routes
app.use('/api', authMiddleware);

// API Routes
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminMiddleware, adminRoutes);

// Comprehensive Health Check
app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  let geminiStatus = 'not_configured';
  if (process.env.GEMINI_API_KEY) {
    geminiStatus = 'configured';
  }

  let mlServiceStatus = 'unknown';
  const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  try {
    const mlRes = await fetch(`${mlServiceUrl}/health`, { signal: AbortSignal.timeout(2000) });
    mlServiceStatus = mlRes.ok ? 'healthy' : 'degraded';
  } catch {
    mlServiceStatus = 'unreachable';
  }

  const isHealthy = mongoStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
      gemini: geminiStatus,
      redis: process.env.REDIS_URI ? 'configured' : 'not_configured',
      mlService: mlServiceStatus,
    },
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Prometheus-compatible metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send([
    `# HELP aras_up ARAS Backend is running`,
    `# TYPE aras_up gauge`,
    `aras_up 1`,
    `# HELP aras_mongodb_connected MongoDB connection state (1=connected)`,
    `# TYPE aras_mongodb_connected gauge`,
    `aras_mongodb_connected ${mongoose.connection.readyState === 1 ? 1 : 0}`,
  ].join('\n'));
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`✓ ARAS Backend running on port ${PORT}`);
  logger.info(`✓ Health endpoint: http://localhost:${PORT}/health`);
});

export default app;
