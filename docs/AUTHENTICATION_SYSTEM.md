# Enterprise-Grade Type-Safe Authentication System

## Overview

This document describes the comprehensive, production-ready authentication and authorization system implemented for the ARAS application. The system provides:

1. ✅ Complete Type Safety: No more "possibly undefined" errors for `req.user`
2. ✅ Type Guards & Assertions: Compile-time and runtime guarantees
3. ✅ Per-User Data Isolation: Multi-tenant security built in
4. ✅ Admin Role Enforcement: Strict admin access control
5. ✅ Clean Code Patterns: Reusable, maintainable endpoint handlers
6. ✅ Enterprise Audit Logging: Admin actions automatically logged

---

## Architecture

### Core Types

The system is built on a single, strict `RequestUser` type defined in `src/utils/userAuth.ts`:

```typescript
interface RequestUser {
  _id: string;                   // MongoDB ObjectID as string
  role: 'user' | 'admin';        // Strict role enum
  email?: string;                // Optional email
  name?: string;                 // Optional name
  firebaseUid?: string;          // Optional Firebase UID
  lastLoginAt?: Date;            // Optional last login timestamp
}
```

This type is guaranteed to be present after the `authMiddleware` runs.

### Type Safety Guarantees

#### Express Request Extension

In `src/types/express.d.ts`:

```typescript
declare module 'express-serve-static-core' {
  interface Request {
    user?: RequestUser;           // Type-safe at the Express level
    firebaseUser?: admin.auth.DecodedIdToken;
  }
}
```

#### Type Guard Functions

All type checking is provided by reusable guards in `src/utils/userAuth.ts`:

| Function | Purpose | Example |
|----------|---------|---------|
| `assertUser(req.user)` | Assert req.user exists and is valid | Used internally by wrapper functions |
| `isAdmin(user)` | Check if user has admin role | Conditional role checking |
| `isRegularUser(user)` | Check if user has regular user role | Conditional role checking |
| `assertAdmin(user)` | Assert user is admin, throw if not | Used internally by requireAdmin |

---

## Usage Patterns

### Pattern 1: Wrapper Functions (Recommended) ⭐

For async endpoints, use the `requireUser` or `requireAdmin` wrapper functions. These:
- Eliminate repetitive null checks
- Provide type-safe user parameter
- Handle errors consistently
- Add automatic audit logging (for `requireAdmin`)

```typescript
// ❌ OLD WAY - Repetitive, error-prone
export const createChat = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = req.user._id.toString();
  // ... rest of logic
};

// ✅ NEW WAY - Clean, type-safe, maintainable
export const createChat = requireUser(async (req, res, next, user) => {
  // user is guaranteed to be RequestUser here
  const userId = user._id;  // No type uncertainty
  // ... rest of logic
});
```

Benefits:
- Type `user` is narrowed to `RequestUser` (non-optional)
- No need for null checks or assertions
- Authentication errors handled automatically
- Clear and concise code

### Pattern 2: Type Guard + Manual Handling

For synchronous endpoints or special cases:

```typescript
import { assertUser } from '../utils/userAuth';

export const syncEndpoint = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = assertUser(req.user);
    // Now user is type-safe RequestUser
    console.log(user._id, user.role, user.email);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};
```

### Pattern 3: Admin-Only Endpoints

Use `requireAdmin` for endpoints that require admin role:

```typescript
// Type-safe AND role-verified in one middleware-like function
export const deleteUser = requireAdmin(async (req, res, next, admin) => {
  // admin is guaranteed to be RequestUser with role === 'admin'
  // Admin actions are automatically logged
  logger.info(`Admin action: ${admin.email} deleted user ${req.params.id}`);
  // ... delete logic
});
```

Admin Middleware: Use this in routes if you prefer traditional middleware:

```typescript
// routes/adminRoutes.ts
router.delete('/users/:id', adminMiddleware, async (req, res, next) => {
  const user = assertUser(req.user);
  // ... logic
});
```

---

## Per-User Data Isolation (Security)

### Query-Level Isolation

Always include `userId` in database queries to prevent cross-user data access:

```typescript
import { createUserFilter, enforceUserIsolation } from '../utils/userAuth';

// Option 1: Simple helper
const documents = await Document.find(createUserFilter(user));

// Option 2: With additional filters
const filter = createUserFilter(user, { status: 'active' });
const results = await Document.find(filter);

// Option 3: Manual (for complex queries)
const query = enforceUserIsolation({ status: 'active', archived: false }, user);
const results = await Document.find(query);
```

### Resource-Level Verification

Double-check that a user owns a resource before operating on it:

```typescript
import { assertUserOwnsResource } from '../utils/userAuth';

const document = await Document.findById(docId);
assertUserOwnsResource(document, user);  // Throws if user doesn't own it
// Safe to process document now
```

Why double-check?
- Defense in depth: catch bugs where document wasn't queried correctly
- Explicit security intent: auditors can see the check
- Runtime safety: catch data corruption or middleware issues

---

## Admin Role System

### One Admin Account

Only the configured admin account can have the `'admin'` role:

Configuration:
```typescript
// src/utils/adminValidation.ts
const ALLOWED_ADMIN_EMAIL = 'scholaraiteam@scholarai.ac.in';
const ALLOWED_ADMIN_USERNAME = 'scholarai';
```

### Admin Enforcement Flow

```
User Authenticates
    ↓
authMiddleware checks Firebase claims + allowed admin list
    ↓
If email/name matches ALLOWED_ADMIN → role = 'admin'
    ↓
Otherwise, always → role = 'user' (forced)
    ↓
req.user assigned with correct role
    ↓
Admin routes check role with requireAdmin or adminMiddleware
```

### Admin Security Checks

In controllers:
```typescript
// Using wrapper (preferred)
export const getUsers = requireAdmin(async (req, res, next, admin) => {
  logger.info(`[AdminController] getAllUsers called by admin: ${admin.email}`);
  // admin.role is guaranteed to be 'admin' here
});

// Using middleware (alternative)
router.get('/users', adminMiddleware, async (req, res) => {
  const admin = assertAdmin(assertUser(req.user));
  // Now type-safe
});
```

Error responses:
```typescript
// 401 - Not authenticated
{ "error": "Unauthorized: User is not authenticated..." }

// 403 - Not authorized (not admin)
{ "error": "Forbidden: This action requires admin privileges..." }
```

---

## Files Changed

### New Files

1. `src/utils/userAuth.ts` (NEW)
   - Core type definitions (`RequestUser`, `UserRole`)
   - Type guard functions (`assertUser`, `assertAdmin`, `isAdmin`, etc.)
   - Helper functions (`getUserId`, `enforceUserIsolation`, etc.)
   - Wrapper functions (`requireUser`, `requireAdmin`)
   - Security utilities (`assertUserOwnsResource`, `createUserFilter`)
   - Custom error class (`AuthenticationError`)

### Modified Files

1. `src/types/express.d.ts`
   - Removed duplicate type definitions
   - Imports `RequestUser` from `userAuth.ts`
   - Single source of truth for Express Request extension

2. `src/middleware/authMiddleware.ts`
   - Imports types from `userAuth.ts` (no duplicate definitions)
   - Uses `RequestUser` interface consistently
   - Cleaner, more maintainable code
   - Added `name`, `firebaseUid`, `lastLoginAt` to req.user

3. `src/controllers/chatController.ts`
   - All endpoints use `requireUser` wrapper
   - Eliminated inline null checks
   - Type-safe user access throughout

4. `src/controllers/documentController.ts`
   - All endpoints use `requireUser` wrapper
   - Uses `createUserFilter` for query-level isolation
   - Uses `assertUserOwnsResource` for extra safety
   - Consistent, clean error handling

5. `src/controllers/analysisController.ts`
   - All endpoints use `requireUser` wrapper
   - Type-safe user access
   - Document ownership verification before analysis

6. `src/controllers/adminController.ts`
   - `getSystemMetrics` uses `requireUser`
   - `getUsers` uses `requireAdmin` with audit logging
   - `deleteUser` uses `requireAdmin` with safety checks
   - Admin actions automatically logged

7. `src/controllers/searchController.ts`
   - Uses `requireUser` wrapper
   - Query-level multi-tenant isolation
   - Verifies user owns all documents before search
   - Security logging for suspicious activity

---

## Error Handling

### AuthenticationError Class

Custom error for auth failures:

```typescript
import { AuthenticationError } from '../utils/userAuth';

throw new AuthenticationError('FORBIDDEN', 'Admin access required');
// Automatically converted to 403 HTTP response
```

Error codes:
- `'MISSING_USER'` → 401
- `'INVALID_USER'` → 401
- `'UNAUTHORIZED'` → 401
- `'FORBIDDEN'` → 403

### Wrapper Error Handling

The `requireUser` and `requireAdmin` wrappers automatically:
1. Catch `AuthenticationError` and return appropriate HTTP status with message
2. Pass other errors to `next(error)` for global error handler
3. Wrap try-catch so no need for try-catch in handler body

### Manual Error Handling

```typescript
import { assertUser, AuthenticationError } from '../utils/userAuth';

export const myEndpoint = (req, res, next) => {
  try {
    const user = assertUser(req.user);
    // ... logic
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.getStatusCode()).json({ error: error.message });
    }
    next(error);
  }
};
```

---fhf

## Testing & Verification

### Type Checking

Run TypeScript compiler to verify no type errors:

```bash
cd backend
npm run build
# or
tsc --noEmit
```

### Runtime Testing

Use the provided type guards in tests:

```typescript
import { isRequestUser, isAdmin } from '../utils/userAuth';

// Test user types
const user = req.user;
expect(isRequestUser(user)).toBe(true);
expect(isAdmin(user)).toBe(false);
```

### Integration Testing

Test endpoints with authentication:

```typescript
describe('Chat Controller', () => {
  it('should require authentication', async () => {
    const res = await request(app).post('/api/chat');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('authenticated');
  });

  it('should access user data safely', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(400); // Missing body, not auth error
  });
});
```

---

## Troubleshooting

### Issue: "Property '_id' does not exist on type '(RequestUser | undefined)'"

Solution: Use the wrapper function or assert user:

```typescript
// ❌ Wrong
const userId = req.user._id;  // TypeScript error

// ✅ Correct
export const endpoint = requireUser(async (req, res, next, user) => {
  const userId = user._id;  // user is RequestUser, not optional
});
```

### Issue: "This comparison appears to be unintentional because the types... have no overlap"

Solution: Ensure user is asserted/wrapped before role comparison:

```typescript
// ❌ Wrong
if (req.user.role === 'admin') {  // TypeScript doesn't know req.user is RequestUser

// ✅ Correct
const user = assertUser(req.user);
if (user.role === 'admin') {  // Now it knows the type
```

### Issue: Admin endpoints accessible to non-admins

Solution: Use `requireAdmin` wrapper or check `adminMiddleware` is applied:

```typescript
// ✅ Correct - Admin enforced at middleware level
router.delete('/users/:id', adminMiddleware, deleteUserHandler);

// ✅ Correct - Admin enforced in wrapper
export const deleteUser = requireAdmin(async (req, res, next, admin) => {
  // ...
});
```

---

## Migration Guide

### Converting Old Endpoints

Before:
```typescript
export const getDocuments = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user._id;
    const docs = await Document.find({ userId });
    res.json(docs);
  } catch (error) {
    next(error);
  }
};
```

After:
```typescript
export const getDocuments = requireUser(async (req, res, next, user) => {
  const docs = await Document.find(createUserFilter(user));
  res.json(docs);
});
```

Benefits:
- Moved from 9 lines to 4 lines
- Eliminated null check boilerplate
- Type-safe user access
- Automatic error handling

---

## FAQ

Q: Why use RequestUser instead of Express.User?
A: Custom type ensures all required fields are always present and properly typed, with clear role enum.

Q: Should I check per-user isolation at query level or assertion level?
A: Both! Use query-level isolation as primary defense, assertion-level as secondary check for extra safety.

Q: What if I need custom user properties?
A: Extend the `RequestUser` interface in `userAuth.ts` and update authMiddleware to assign them.

Q: Can I use async middleware in routes?
A: Yes! The wrapper functions are compatible with Express routing:
```typescript
router.post('/chat', authMiddleware, createChat);
```

Q: Is the admin enforcement backwards compatible?
A: Yes! The `adminRoleMiddleware` still works with traditional middleware patterns.

---

## Summary

The new system provides:

| Aspect | Before | After |
|--------|--------|-------|
| Type Safety | "possibly undefined" errors | Guaranteed `RequestUser` type |
| Null Checks | Repetitive inline checks | Handled by wrapper functions |
| Admin Verification | Manual role checks | Automatic with `requireAdmin` |
| Per-User Isolation | Optional, easy to miss | Built into query helpers |
| Error Handling | Mixed patterns | Consistent via wrappers |
| Audit Logging | Manual in each endpoint | Automatic for admin routes |
| Code Lines | ~10 per endpoint | ~4-5 per endpoint |
| Maintainability | Medium | High |

All TypeScript errors are resolved. The system is production-ready, secure, and maintainable.
