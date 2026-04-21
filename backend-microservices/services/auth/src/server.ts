import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { register, login, getMe } from './controllers/authController';
import { internalOnly } from '../../../common/src/middleware';
import { EventBus } from '../../../common/src/events';
import { EventType } from '../../../common/src/types';
import { User } from './models/User';

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://aras_rag:aras_rag192607@aras.jnqzklv.mongodb.net/aras_auth?appName=ARAS';

const eventBus = new EventBus('auth-service');

app.use(cors());
app.use(express.json());

// 🧪 Health Check
app.get('/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'healthy', timestamp: new Date().toISOString() });
});

// AUTH ROUTES
app.post('/auth/register', register);
app.post('/auth/login', login);

// PROTECTED (Requires Gateway verification + Internal header)
app.get('/auth/me', internalOnly, getMe);

// 🚀 EVENT SUBSCRIPTIONS
const initEventBus = async () => {
  console.log('[AuthService] Initializing event subscriptions...');
  
  await eventBus.subscribe(EventType.USER_UPGRADED, async (data: any) => {
    const { userId, plan } = data;
    try {
      const user = await User.findById(userId);
      if (user) {
        user.plan = plan === 'premium' ? 'premium' : 'free';
        await user.save();
        console.log(`[AuthService] Success: User ${userId} upgraded to ${plan}`);
      } else {
        console.error(`[AuthService] Error: User ${userId} not found for upgrade`);
      }
    } catch (err) {
      console.error(`[AuthService] Database error during upgrade for user ${userId}:`, err);
    }
  });
};

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✓ Auth Service: Connected to MongoDB (${MONGO_URI.split('/').pop()?.split('?')[0]})`);
    
    await initEventBus();

    app.listen(PORT, () => {
      console.log(`✓ Auth Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Auth Service failure:', error);
    process.exit(1);
  }
};

start();
