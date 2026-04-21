import express from 'express';
// Ensure healthService module exists and correct import path
import { checkMongoDB, checkRedis, checkMLService, checkStorage } from '../services/healthService';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [mongodb, redis, mlService, storage] = await Promise.all([
      checkMongoDB(),
      checkRedis(),
      checkMLService(),
      checkStorage(),
    ]);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb,
        redis,
        mlService,
        storage,
      },
      version: '1.0.0',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;