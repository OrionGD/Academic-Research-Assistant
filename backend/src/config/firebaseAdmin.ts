import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  logger.error('[Firebase] Missing required Firebase configuration environment variables.');
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: process.env.STORAGE_BUCKET,
  });
  logger.info('[Firebase] Admin SDK initialized successfully');
} catch (error) {
  logger.error('[Firebase] SDK initialization failed:', error);
}

export const firebaseAdmin = admin;
export const auth = admin.auth();
