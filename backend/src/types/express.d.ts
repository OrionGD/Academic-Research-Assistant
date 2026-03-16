import * as admin from 'firebase-admin';

declare global {
  namespace Express {
    interface Request {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user?: any; // Mongoose IUser document — typed as any to match original authMiddleware declaration
      firebaseUser?: admin.auth.DecodedIdToken;
    }
  }
}
