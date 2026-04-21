import { Router } from 'express';
import { verifyFirebaseToken, refresh, logout, getProfile, updateProfile, register, login } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Traditional email/password signup
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Traditional email/password login
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/verify-firebase
 * @desc    Initial login: verify Firebase ID token and issue JWT pair (Refresh token in cookie)
 * @access  Public
 */
router.post('/verify-firebase', verifyFirebaseToken);

/**
 * @route   POST /api/auth/refresh
 * @desc    Rotate access and refresh tokens using the secure cookie
 * @access  Public (Requires refreshToken cookie)
 */
router.post('/refresh', refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Revoke session in Redis and clear the refresh token cookie
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile (using accessToken)
 * @access  Protected
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Protected
 */
router.put('/profile', authMiddleware, updateProfile);

export default router;