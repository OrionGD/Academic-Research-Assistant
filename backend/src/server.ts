import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
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
const PORT = process.env.PORT || 8000;

// Init services
connectDB();
initializeFirebase();
initializeStorage();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// Apply global authentication except for maybe public routes
app.use('/api', authMiddleware);

// API Routes
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/chat', chatRoutes);

// Admin Routes
app.use('/api/admin', adminMiddleware, adminRoutes);

// Health Check
app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  // Simplified redis and gemini health ping
  
  res.json({ 
      status: 'ok', 
      timestamp: new Date(),
      services: {
          mongodb: mongoStatus,
          redis: process.env.REDIS_URI ? 'configured' : 'not_configured',
          gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured'
      }
  });
});

// Error handling generic
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

export default app;
