import express from 'express';
import proxy from 'express-http-proxy';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { gatewayVerify } from '../../common/src/middleware';

const app = express();
const PORT = process.env.PORT || 80;

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please slow down.' }
});

app.use(cors());
app.use(limiter);
app.use(express.json());

// 🧪 Health Check
app.get('/health', (req, res) => {
  res.json({ gateway: 'healthy', timestamp: new Date().toISOString() });
});

// SERVICE DISCOVERY (Simple URLs for Docker Compose)
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';
const CHAT_SERVICE = process.env.CHAT_SERVICE_URL || 'http://chat-service:5002';
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:5003';

/**
 * AUTH ROUTES (Mixed: Login/Register are public, /me is verified)
 */
app.use('/api/auth/login', proxy(AUTH_SERVICE, { proxyReqPathResolver: () => '/auth/login' }));
app.use('/api/auth/register', proxy(AUTH_SERVICE, { proxyReqPathResolver: () => '/auth/register' }));
app.use('/api/auth/me', gatewayVerify, proxy(AUTH_SERVICE, { proxyReqPathResolver: () => '/auth/me' }));

/**
 * CHAT & PAYMENT (All verified)
 */
app.use('/api/chat', gatewayVerify, proxy(CHAT_SERVICE));
app.use('/api/payment', gatewayVerify, proxy(PAYMENT_SERVICE));

app.listen(PORT, () => {
  console.log(`🚀 ARAS API Gateway running on port ${PORT}`);
  console.log(`Routes:
  - /api/auth/login -> ${AUTH_SERVICE}
  - /api/auth/register -> ${AUTH_SERVICE}
  - /api/auth/me -> ${AUTH_SERVICE} (Verified)
  - /api/chat -> ${CHAT_SERVICE} (Verified)
  - /api/payment -> ${PAYMENT_SERVICE} (Verified)`);
});
