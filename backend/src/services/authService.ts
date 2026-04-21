import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { auth as firebaseAuth } from '../config/firebaseAdmin';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';
import * as sessionService from './sessionService';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRES_IN || '15m'; // 15 minutes
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // 7 days
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

export interface TokenPayload {
  userId: string;
  firebaseUid: string;
  role: string;
  email: string;
  jti: string;
}

export interface FirebaseVerifiedUser {
  firebaseUid: string;
  email: string;
  name: string;
  photoURL?: string;
  provider: string;
}

/**
 * Verify Firebase ID Token and return user details
 */
export async function verifyFirebaseToken(idToken: string): Promise<FirebaseVerifiedUser> {
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const provider = decodedToken.firebase.sign_in_provider || 'password';
    
    return {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || '',
      photoURL: decodedToken.picture || '',
      provider
    };
  } catch (error: any) {
    logger.error(`[AuthService] Firebase token verification failed: ${error.message}`);
    throw new Error('Invalid Firebase token');
  }
}

/**
 * Sync Firebase user with MongoDB (UPSERT)
 */
export async function syncUserToMongoDB(firebaseUser: FirebaseVerifiedUser): Promise<IUser> {
  try {
    const { firebaseUid, email, name, photoURL, provider } = firebaseUser;

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: { email, name, photoURL, lastLoginAt: new Date() },
        $addToSet: { authProviders: provider },
        $setOnInsert: {
          role: 'user',
          planTier: 'FREE',
          subscriptionStatus: 'inactive',
          monthlyUploads: 0,
          monthlyQueries: 0,
          documentCount: 0,
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    if (!user) throw new Error('Failed to sync user to MongoDB');
    return user;
  } catch (error: any) {
    logger.error(`[AuthService] MongoDB sync failed: ${error.message}`);
    throw new Error('Database synchronization failed');
  }
}

/**
 * Enterprise Token Generation logic with rotation support
 */
export async function generateTokenPair(user: IUser): Promise<{ accessToken: string, refreshToken: string }> {
  const jti = uuidv4();
  const payload: Omit<TokenPayload, 'jti'> = {
    userId: user._id.toString(),
    firebaseUid: user.firebaseUid,
    role: user.role,
    email: user.email,
  };

  const accessToken = jwt.sign({ ...payload, jti: uuidv4() }, ACCESS_SECRET as jwt.Secret, { expiresIn: ACCESS_EXPIRY as any });
  const refreshToken = jwt.sign({ ...payload, jti }, REFRESH_SECRET as jwt.Secret, { expiresIn: REFRESH_EXPIRY as any });

  await sessionService.createSession(user._id.toString(), jti, REFRESH_TTL);
  return { accessToken, refreshToken };
}

/**
 * Handle Refresh Token Rotation and Reuse Detection
 */
export async function rotateTokens(token: string): Promise<{ accessToken: string, refreshToken: string }> {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET as jwt.Secret) as TokenPayload;
    const { userId, jti } = decoded;

    const status = await sessionService.getSessionStatus(userId, jti);

    if (status === 'not_found' || status === 'revoked') {
      throw new Error('Session invalid');
    }

    if (status === 'used') {
      logger.error(`[AuthService] REUSE DETECTED for user ${userId}, jti: ${jti}. Revoking all sessions!`);
      await sessionService.revokeAllSessions(userId);
      throw new Error('Security breach detected');
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const newJti = uuidv4();
    const payload: Omit<TokenPayload, 'jti'> = {
      userId: user._id.toString(),
      firebaseUid: user.firebaseUid,
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign({ ...payload, jti: uuidv4() }, ACCESS_SECRET as jwt.Secret, { expiresIn: ACCESS_EXPIRY as any });
    const refreshToken = jwt.sign({ ...payload, jti: newJti }, REFRESH_SECRET as jwt.Secret, { expiresIn: REFRESH_EXPIRY as any });

    await sessionService.rotateSession(userId, jti, newJti, REFRESH_TTL);
    return { accessToken, refreshToken };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') throw new Error('Refresh token expired');
    throw error;
  }
}

/**
 * Revoke specific session (Logout)
 */
export async function logout(token: string): Promise<void> {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as TokenPayload;
    await sessionService.revokeSession(decoded.userId, decoded.jti);
  } catch (error) {}
}

/**
 * Register a new user with email and password
 */
export async function register(email: string, password: string, name: string): Promise<IUser> {
  try {
    const userRecord = await firebaseAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const user = await syncUserToMongoDB({
      firebaseUid: userRecord.uid,
      email: userRecord.email || email,
      name: userRecord.displayName || name,
      provider: 'password',
    });

    return user;
  } catch (error: any) {
    logger.error(`[AuthService] Registration failed: ${error.message}`);
    if (error.code === 'auth/email-already-exists') {
      throw new Error('Email already exists');
    }
    throw new Error(error.message || 'Registration failed');
  }
}

/**
 * Login user with email and password via Firebase REST API
 */
export async function login(email: string, password: string): Promise<IUser> {
  try {
    if (!FIREBASE_API_KEY) {
      throw new Error('Firebase API key is missing on the server');
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      const errorMsg = data.error?.message || 'Login failed';
      logger.warn(`[AuthService] Firebase login failed for ${email}: ${errorMsg}`);
      
      if (errorMsg === 'EMAIL_NOT_FOUND' || errorMsg === 'INVALID_PASSWORD') {
        throw new Error('Invalid email or password');
      }
      throw new Error(errorMsg);
    }

    // data.localId is the firebaseUid
    // We can also use data.idToken to verify, but we already trust the REST API response
    const user = await syncUserToMongoDB({
      firebaseUid: data.localId,
      email: data.email,
      name: data.displayName || '',
      provider: 'password',
    });

    return user;
  } catch (error: any) {
    logger.error(`[AuthService] Login failed: ${error.message}`);
    throw error;
  }
}
