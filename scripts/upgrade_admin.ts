import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from './backend/src/models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aras';

async function upgradeUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const email = 'oriongd@aras.ai';
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log(`[SUCCESS] User ${email} upgraded to role: ${user.role}`);
    } else {
      console.log(`[ERROR] User ${email} not found in database.`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error upgrading user:', error);
    process.exit(1);
  }
}

upgradeUser();
