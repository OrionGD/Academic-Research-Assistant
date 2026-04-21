import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt';
import { UserPayload, UserRole } from './types';

// Internal Service Token for Service-to-Service auth
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'aras-internal-secret';

/**
 * API Gateway Middleware
 * Verifies JWT and forwards user info via headers
 */
export const gatewayVerify = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid Token' });
  }

  // Forward user details to internal services via headers
  req.headers['x-user-id'] = payload.id;
  req.headers['x-user-email'] = payload.email;
  req.headers['x-user-role'] = payload.role;
  req.headers['x-user-plan'] = payload.plan;
  
  // Also sign the request as a trusted internal service
  req.headers['x-service-token'] = SERVICE_TOKEN;

  next();
};

/**
 * Service-Level Middleware
 * Validates that request came from the trusted API Gateway or another internal service
 */
export const internalOnly = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-service-token'];
  if (token !== SERVICE_TOKEN) {
    return res.status(403).json({ error: 'Forbidden: Internal services only' });
  }
  next();
};

/**
 * Role-Based Authorization
 */
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.headers['x-user-role'] as UserRole;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

/**
 * Extract user for service controllers
 */
export const getRequestUser = (req: Request): UserPayload | null => {
  const id = req.headers['x-user-id'] as string;
  if (!id) return null;

  return {
    id,
    email: req.headers['x-user-email'] as string,
    role: req.headers['x-user-role'] as UserRole,
    plan: req.headers['x-user-plan'] as UserPlan
  };
};
