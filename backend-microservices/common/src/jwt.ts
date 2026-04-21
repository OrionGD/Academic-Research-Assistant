import jwt from 'jsonwebtoken';
import { UserPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'aras-secret-key-2024';

export const signToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
};
