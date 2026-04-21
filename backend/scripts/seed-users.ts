import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/models/User';

// Load env from the parent directory (backend/.env)
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables.');
  process.exit(1);
}

const USERS = [
  {
    email: 'godfrey.cs23@krct.ac.in',
    name: 'Godfrey Admin',
    firebaseUid: 'vgJ1HhHDUxV2K3z6UeeI46dYDZl1',
    role: 'admin',
    planTier: 'PRO',
  },
  {
    email: 'hariprakash@aras.ai',
    name: 'Hari Prakash',
    firebaseUid: 'vqUnXJhDFoO6qP0owd8U4VTpCIv2',
    role: 'user',
    planTier: 'PRO',
  },
  {
    email: 'oppo@aras.ai',
    name: 'Oppo User',
    firebaseUid: 'aQD7HNkedgdRWfG1eMSqSvWtLNI2',
    role: 'user',
    planTier: 'BASIC',
  },
  {
    email: 'grish@aras.ai',
    name: 'Grish User',
    firebaseUid: 'EDP4GkogIvXv56fsBr9BRbdQsKY2',
    role: 'user',
    planTier: 'STANDARD',
  },
  {
    email: 'oriongd@aras.ai',
    name: 'Orion User',
    firebaseUid: 'ptNLSBU6ENgdnYE4oAJIpZxieaV2',
    role: 'user',
    planTier: 'PRO',
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to MongoDB.');

    for (const userData of USERS) {
      console.log(`Syncing user: ${userData.email}...`);
      
      const updatedUser = await User.findOneAndUpdate(
        { email: userData.email },
        {
          $set: {
            firebaseUid: userData.firebaseUid,
            name: userData.name,
            role: userData.role as any,
            planTier: userData.planTier as any,
            plan: userData.planTier as any, // Legacy alias
            subscriptionStatus: 'active', // Assuming all these test users are active
            lastLoginAt: new Date(),
          },
          $setOnInsert: {
            authProviders: ['password'],
            monthlyUploads: 0,
            monthlyQueries: 0,
            documentCount: 0,
            storageUsedMb: 0,
          }
        },
        { upsert: true, new: true, runValidators: true }
      );

      console.log(`✓ User ${userData.email} synchronized (UID: ${updatedUser.firebaseUid}, Tier: ${updatedUser.planTier})`);
    }

    console.log('--- Seeding completed successfully ---');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
