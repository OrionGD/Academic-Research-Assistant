import { logger } from './logger';

/**
 * Admin Validation Utility
 *
 * Enforces the rule that only ONE account can be an admin:
 * Email: scholaraiteam@scholarai.ac.in
 * Username: scholarai
 */

export const ADMIN_EMAILS = [
  'scholaraiteam@scholarai.ac.in',
  'godfrey.cs23@krct.ac.in',
];

/**
 * Check if an email/username is the allowed admin account
 */
export function isAllowedAdminAccount(email?: string, name?: string): boolean {
  if (!email) return false;

  const normalizedEmail = email.toLowerCase();
  const isAllowedEmail = ADMIN_EMAILS.some((e) => e.toLowerCase() === normalizedEmail);

  return isAllowedEmail;
}

/**
 * Validate and enforce that only the allowed admin can have admin role.
 * Returns the correct role for the user.
 *
 * @param email User's email
 * @param name User's name/username
 * @param requestedRole The role being requested/claimed
 * @returns The actual role that should be assigned ('user' or 'admin')
 */
export function enforceAdminRole(email?: string, name?: string, requestedRole?: string): 'user' | 'admin' {
  // Only the allowed admin can have admin role
  if (requestedRole === 'admin' || requestedRole === 'admin') {
    if (!isAllowedAdminAccount(email, name)) {
      logger.warn(
        `[Admin Validation] Attempt to assign admin role to non-allowed account: ${email || 'unknown'}`
      );
      return 'user'; // Force to user role
    }
    logger.info(`[Admin Validation] Allowed admin account authenticated: ${email}`);
    return 'admin';
  }

  return 'user';
}

/**
 * Validate that a user is the sole admin account
 */
export function isAllowedAdmin(email?: string, name?: string): boolean {
  return isAllowedAdminAccount(email, name);
}
