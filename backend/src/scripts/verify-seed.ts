import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aras';

async function verify() {
  try {
    await mongoose.connect(MONGODB_URI);
    const users = await User.find({
      email: { $in: [
        'godfrey.cs23@krct.ac.in',
        'hariprakash@aras.ai',
        'oppo@aras.ai',
        'grish@aras.ai',
        'oriongd@aras.ai'
      ]}
    }).select('email role planTier');

    console.log('Seeded Users Verification:');
    users.forEach(u => {
      console.log(`- ${u.email}: Role=${u.role}, Tier=${u.planTier}`);
    });

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
