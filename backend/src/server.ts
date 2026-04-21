import dotenv from 'dotenv';
import path from 'path';
// Load environment from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/mongodb';
import { initializeStorage } from './config/storage';
import { logger } from './utils/logger';
import { setIo } from './utils/socketService';

// Middleware
import { authMiddleware } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { errorMiddleware } from './middleware/errorMiddleware';

// Routes
import documentRoutes from './routes/documentRoutes';
import searchRoutes from './routes/searchRoutes';
import analysisRoutes from './routes/analysisRoutes';
import chatRoutes from './routes/chatRoutes';
import adminRoutes from './routes/adminRoutes';
import supportRoutes from './routes/supportRoutes';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import upgradeRoutes from './routes/upgradeRoutes';
import billingRoutes from './routes/billingRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const IS_DEV = process.env.NODE_ENV !== 'production';

// Socket.IO Setup
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Register the io instance in the singleton service (avoids circular imports)
setIo(io);

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_room', (userId) => {
    socket.join(userId);
    logger.info(`User ${userId} joined room`);
  });

  socket.on('join_admin', () => {
    socket.join('admin_room');
    logger.info(`Admin joined admin_room: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-API-Key'],
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ── Body Parsing & Cookies ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ── PUBLIC ROUTES (no auth, no rate limit) ─────────────────────────────────────────
app.use('/api/health', healthRoutes);

// ── AUTH ROUTES: rate-limited separately (lenient) ───────────────────────────
app.use('/api/auth', authLimiter, authRoutes);

// ── PUBLIC billing routes ─────────────────────────────────────────────────────
app.get('/api/billing/plans', (req, res) => {
  import('./controllers/billingController').then(m => m.getPlans(req, res));
});

// ── RAZORPAY WEBHOOK (raw body, no auth) ──────────────────────────────────────
app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const { handleWebhook } = await import('./controllers/billingController');
    return handleWebhook(req, res);
  }
);

// ── AUTHENTICATED ROUTES ──────────────────────────────────────────────────────
// authMiddleware is applied BEFORE apiLimiter so req.user is set for plan-aware limiting
app.use('/api', authMiddleware);

// Apply API rate limiter after auth (req.user is now populated)
app.use('/api', apiLimiter);

// API Routes
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/keys', apiKeyRoutes);

// ── ERROR HANDLING ────────────────────────────────────────────────────────────
app.use(errorMiddleware);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    initializeStorage();
    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      const { networkInterfaces } = require('os');
      const nets = networkInterfaces();
      const addresses = [];
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            addresses.push(net.address);
          }
        }
      }

      logger.info(`✓ ARAS Backend & Socket.IO running on port ${PORT}`);
      logger.info(`✓ Accessible from Host at: http://${addresses[0] || 'localhost'}:${PORT}`);
      logger.info(`✓ SaaS billing enabled — Razorpay webhook at /api/billing/webhook`);
      logger.info(`✓ Rate limiting mode: ${IS_DEV ? 'DISABLED (dev)' : 'ACTIVE (prod)'}`);
    });
  } catch (error) {
    logger.error('Critical failure during server startup:', error);
    process.exit(1);
  }
};

startServer();

export default app;
