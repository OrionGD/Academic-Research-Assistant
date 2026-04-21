import { Request, Response, NextFunction } from 'express';

/**
 * premiumMiddleware
 * 
 * Verifies that the authenticated user has a 'premium' plan.
 */
export const premiumMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
  }

  if (req.user.plan !== 'premium' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Upgrade Required', 
      message: 'This feature is only available for premium members.' 
    });
  }

  next();
};
