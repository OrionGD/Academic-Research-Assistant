import { Request, Response } from 'express';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import * as authService from '../services/authService';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Main authentication entry point: Verifies Firebase ID token, 
 * syncs user with MongoDB, and issues a JWT pair.
 * 
 * POST /api/auth/verify-firebase
 */
export const verifyFirebaseToken = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ 
        error: 'ID_TOKEN_REQUIRED', 
        message: 'Firebase ID token is required.' 
      });
    }

    // 1. Verify and Sync
    const firebaseUser = await authService.verifyFirebaseToken(idToken);
    const user = await authService.syncUserToMongoDB(firebaseUser);

    // 2. Issue Standardized Token Pair
    const { accessToken, refreshToken } = await authService.generateTokenPair(user);

    // 3. Set Refresh Token in HttpOnly Cookie (Hardened)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: IS_PROD, // Only send over HTTPS in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 4. Return Access Token + User Info (alias token for frontend compat)
    res.status(200).json({
      accessToken,
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        planTier: user.planTier,
      }
    });
  } catch (error: any) {
    logger.error(`[Auth] Verification failed: ${error.message}`);
    res.status(401).json({ error: 'AUTHENTICATION_FAILED', message: error.message });
  }
};

/**
 * Traditional Email/Password Signup
 * 
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and password are required.' });
    }

    const user = await authService.register(email, password, name);
    const { accessToken, refreshToken } = await authService.generateTokenPair(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      accessToken,
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        planTier: user.planTier,
      }
    });
  } catch (error: any) {
    logger.error(`[Auth] Registration failed: ${error.message}`);
    res.status(400).json({ error: 'REGISTRATION_FAILED', message: error.message });
  }
};

/**
 * Traditional Email/Password Login
 * 
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and password are required.' });
    }

    const user = await authService.login(email, password);
    const { accessToken, refreshToken } = await authService.generateTokenPair(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      accessToken,
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        planTier: user.planTier,
      }
    });
  } catch (error: any) {
    logger.error(`[Auth] Login failed: ${error.message}`);
    res.status(401).json({ error: 'LOGIN_FAILED', message: error.message });
  }
};

/**
 * Refresh Access Token using Refresh Token Rotation
 * 
 * POST /api/auth/refresh
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    // 1. Extract Refresh Token from Secure Cookie
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({ error: 'REFRESH_TOKEN_REQUIRED' });
    }

    // 2. Perform Rotation
    const { accessToken, refreshToken } = await authService.rotateTokens(oldRefreshToken);

    // 3. Set NEW Refresh Token in Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 4. Return NEW Access Token
    res.json({ accessToken, token: accessToken });
  } catch (error: any) {
    // If rotation fails (expired, reuse, etc.), clear the cookie
    res.clearCookie('refreshToken');
    
    if (error.message === 'Security breach detected') {
      return res.status(403).json({ 
        error: 'SECURITY_BREACH', 
        message: 'Multiple device login detected or token reuse. All sessions revoked for your security.' 
      });
    }

    res.status(401).json({ error: 'SESSION_EXPIRED', message: 'Please log in again.' });
  }
};

/**
 * Logout: Revoke session in Redis and clear cookie
 * 
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out with errors' });
  }
};

/**
 * Profile endpoints (using accessToken via authMiddleware)
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findByIdAndUpdate(userId, req.body, { new: true });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};