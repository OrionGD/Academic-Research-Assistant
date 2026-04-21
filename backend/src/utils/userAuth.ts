import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * Enterprise-grade user authentication utilities
 *
 * This module provides:
 * 1. Type definitions for authenticated users
 * 2. Type guard functions to assert user presence
 * 3. Higher-order function wrappers for async endpoints
 * 4. Per-user data isolation helpers
 */

// ================== TYPE DEFINITIONS ==================

/**
 * Strict request user type - guaranteed to have these properties
 * when used in authenticated contexts
 */
export interface RequestUser {
  _id: string;
  userId: string; // Alias for _id to satisfy user requirement
  firebaseUid: string;
  role: 'user' | 'admin' | 'researcher' | 'reviewer';
  email?: string;
  name?: string;
  photoURL?: string;
  lastLoginAt?: Date;
  planTier?: 'FREE' | 'BASIC' | 'STANDARD' | 'PRO';
  plan?: string;
  subscriptionStatus?: string;
  upgradeRequestStatus?: string;
}

/**
 * User role type - extracted from RequestUser for reusability
 */
export type UserRole = RequestUser['role'];

// ================== TYPE GUARDS ==================

/**
 * Type guard to check if a value is a RequestUser
 * @param user The value to check
 * @returns true if the value is a valid RequestUser
 */
export function isRequestUser(user: unknown): user is RequestUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    '_id' in user &&
    typeof (user as any)._id === 'string' &&
    'role' in user &&
    ['user', 'admin', 'researcher', 'reviewer'].includes((user as any).role)
  );
}

/**
 * Type guard to check if a user has admin role
 * @param user The user to check
 * @returns true if user is defined and has admin role
 */
export function isAdmin(user: RequestUser | undefined): user is RequestUser & { role: 'admin' } {
  return user !== undefined && user.role === 'admin';
}

/**
 * Type guard to check if a user has regular user role
 * @param user The user to check
 * @returns true if user is defined and has user role
 */
export function isRegularUser(user: RequestUser | undefined): user is RequestUser & { role: 'user' } {
  return user !== undefined && user.role === 'user';
}

// ================== ASSERTIONS & ERROR HANDLING ==================

/**
 * Assertion error class for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(
    public code: 'MISSING_USER' | 'INVALID_USER' | 'UNAUTHORIZED' | 'FORBIDDEN' = 'UNAUTHORIZED',
    message: string = 'Authentication failed'
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }

  /**
   * Get HTTP status code for this error
   */
  getStatusCode(): number {
    switch (this.code) {
      case 'MISSING_USER':
      case 'UNAUTHORIZED':
        return 401;
      case 'FORBIDDEN':
        return 403;
      case 'INVALID_USER':
      default:
        return 401;
    }
  }
}

/**
 * Assert that a user is authenticated and valid
 * Throws AuthenticationError if user is missing or invalid
 *
 * Usage:
 *   assertUser(req.user);
 *   // After this line, TypeScript knows req.user is RequestUser
 *
 * @param user The user object from request
 * @returns The user cast as RequestUser
 * @throws AuthenticationError if user is missing or invalid
 */
export function assertUser(user: any): RequestUser {
  if (!user) {
    throw new AuthenticationError(
      'MISSING_USER',
      'Unauthorized: User is not authenticated. Please provide a valid token.'
    );
  }

  if (!isRequestUser(user)) {
    throw new AuthenticationError(
      'INVALID_USER',
      'Unauthorized: User data is malformed or invalid.'
    );
  }

  return user;
}

/**
 * Assert that a user has admin role
 * Throws AuthenticationError if user is not admin
 *
 * Usage:
 *   const user = assertUser(req.user);
 *   assertAdmin(user);
 *   // After this line, TypeScript knows user.role === 'admin'
 *
 * @param user The user object from request
 * @returns The user with role narrowed to 'admin'
 * @throws AuthenticationError if user doesn't have admin role
 */
export function assertAdmin(user: RequestUser): RequestUser & { role: 'admin' } {
  if (user.role !== 'admin') {
    throw new AuthenticationError(
      'FORBIDDEN',
      `Forbidden: This action requires admin privileges. Your role is '${user.role}'.`
    );
  }

  return user as RequestUser & { role: 'admin' };
}

/**
 * Extract userId with guaranteed type safety
 * @param user The user object
 * @returns The user ID as a string
 */
export function getUserId(user: RequestUser): string {
  return user._id.toString();
}

// ================== HIGHER-ORDER FUNCTION WRAPPERS ==================

/**
 * Async endpoint wrapper that ensures user is authenticated
 * Also narrows the request type to include a guaranteed RequestUser
 */
export function requireAuth(
  handler: (req: Request, res: Response, next: NextFunction, user: RequestUser) => Promise<void | any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = assertUser(req.user);
      return await handler(req, res, next, user);
    } catch (error: any) {
      if (error instanceof AuthenticationError) {
        return res.status(error.getStatusCode()).json({ error: error.message });
      }
      next(error);
    }
  };
}

/**
 * Async endpoint wrapper that ensures user is a premium member (pro or enterprise)
 */
export function requirePremium(
  handler: (req: Request, res: Response, next: NextFunction, user: RequestUser) => Promise<void | any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = assertUser(req.user);
      if (user.planTier === 'FREE' || !user.planTier) {
        throw new AuthenticationError('FORBIDDEN', 'Forbidden: This feature requires a premium plan.');
      }
      return await handler(req, res, next, user);
    } catch (error: any) {
      if (error instanceof AuthenticationError) {
        return res.status(error.getStatusCode()).json({ error: error.message });
      }
      next(error);
    }
  };
}

/**
 * Async endpoint wrapper that ensures user has admin role
 * Combines authentication + admin authorization checks
 *
 * Usage:
 *   export const adminOnlyEndpoint = requireAdmin(async (req, res, next, user) => {
 *     // user is guaranteed to have role === 'admin' here
 *     const adminId = user._id;
 *     // ... rest of logic
 *   });
 *
 * @param handler The async endpoint handler
 * @returns An Express endpoint that enforces admin authentication
 *
 * Benefits:
 * - Combines both authentication and authorization
 * - Type-safe: user.role is narrowed to 'admin'
 * - Single point of admin verification
 * - Audit logging of admin actions possible
 */
export function requireAdmin(
  handler: (req: Request, res: Response, next: NextFunction, user: RequestUser & { role: 'admin' }) => Promise<void | any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = assertUser(req.user);
      const adminUser = assertAdmin(user);
      logger.info(`[Admin Action] ${req.method} ${req.path}`, {
        admin: adminUser.email,
        timestamp: new Date().toISOString(),
      });
      return await handler(req, res, next, adminUser);
    } catch (error: any) {
      if (error instanceof AuthenticationError) {
        return res.status(error.getStatusCode()).json({ error: error.message });
      }
      next(error);
    }
  };
}

// ================== DATA ISOLATION HELPERS ==================

/**
 * Enforce per-user data isolation in queries
 * Use this to ensure users can only access their own data
 *
 * Usage:
 *   const query = enforceUserIsolation({ status: 'active' }, req.user);
 *   const documents = await Document.find(query);
 *
 * @param baseQuery The base MongoDB query filter
 * @param user The authenticated user
 * @returns The query filter with userId isolation added
 *
 * Security:
 * - Prevents users from querying other users' data
 * - Should be used in every query that touches multi-tenant data
 * - Ensures row-level security at the database level
 */
export function enforceUserIsolation(
  baseQuery: Record<string, any>,
  user: RequestUser
): Record<string, any> {
  return {
    ...baseQuery,
    userId: user._id,
  };
}

/**
 * Verify that the requesting user owns a specific resource
 * Use this to prevent unauthorized access to specific documents/resources
 *
 * Usage:
 *   const document = await Document.findById(docId);
 *   assertUserOwnsResource(document, req.user);
 *   // Now we know req.user owns this document
 *
 * @param resource The resource with userId field
 * @param user The requesting user
 * @throws AuthenticationError if user doesn't own the resource
 *
 * Security:
 * - Prevents unauthorized access even if attackers know resource IDs
 * - Provides clear error messages for debugging
 * - Acts as a second line of defense after query-level isolation
 */
export function assertUserOwnsResource(
  resource: { userId?: string | any } | null | undefined,
  user: RequestUser
): void {
  if (!resource) {
    throw new AuthenticationError('FORBIDDEN', 'Resource not found');
  }

  const resourceUserId = resource.userId?.toString?.() || resource.userId;
  const userId = user._id.toString?.() || user._id;

  if (resourceUserId !== userId) {
    throw new AuthenticationError(
      'FORBIDDEN',
      'Forbidden: You do not have permission to access this resource.'
    );
  }
}

/**
 * Create a filter object for user isolation with optional additional filters
 * Convenience function for complex queries
 *
 * Usage:
 *   const filter = createUserFilter(req.user, { status: 'active', category: 'documents' });
 *   const results = await Model.find(filter);
 *
 * @param user The authenticated user
 * @param additionalFilters Optional additional MongoDB query filters
 * @returns Combined filter object with userId isolation
 */
export function createUserFilter(
  user: RequestUser,
  additionalFilters?: Record<string, any>
): Record<string, any> {
  return {
    userId: user._id,
    ...additionalFilters,
  };
}
