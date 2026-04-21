import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';

// Look for .env in the root PROJECT folder
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aras';

const USERS = [
  {
    email: 'godfrey.cs23@krct.ac.in',
    name: 'Godfrey Admin',
    role: 'admin',
    planTier: 'FREE',
    firebaseUid: 'seed-admin-uid-001',
    authProviders: ['password'],
  },
  {
    email: 'hariprakash@aras.ai',
    name: 'Hari Prakash',
    role: 'user',
    planTier: 'FREE',
    firebaseUid: 'seed-user-uid-002',
    authProviders: ['password'],
  },
  {
    email: 'oppo@aras.ai',
    name: 'Oppo User',
    role: 'user',
    planTier: 'BASIC',
    firebaseUid: 'seed-user-uid-003',
    authProviders: ['google'],
  },
  {
    email: 'grish@aras.ai',
    name: 'Grish User',
    role: 'user',
    planTier: 'STANDARD',
    firebaseUid: 'seed-user-uid-004',
    authProviders: ['google'],
  },
  {
    email: 'oriongd@aras.ai',
    name: 'Orion User',
    role: 'user',
    planTier: 'PRO',
    firebaseUid: 'seed-user-uid-005',
    authProviders: ['google'],
  },
];

async function seed() {
  try {
    console.log(`Connecting to: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing test users to avoid index conflicts
    const emailsToSeed = USERS.map(u => u.email);
    await User.deleteMany({ email: { $in: emailsToSeed } });
    console.log('Cleared existing test users');

    for (const userData of USERS) {
      console.log(`Creating user ${userData.email} with tier ${userData.planTier}...`);
      await User.create({
        ...userData,
        plan: userData.planTier,
        subscriptionStatus: userData.planTier === 'FREE' ? 'inactive' : 'active',
        currentPeriodEnd: userData.planTier === 'FREE' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
