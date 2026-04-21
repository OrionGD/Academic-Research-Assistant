import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB');

    // 1. Remove scholaraiteam@scholarai.ac.in
    const deletedUser = await mongoose.connection.db?.collection('users').findOneAndDelete({ 
      email: 'scholaraiteam@scholarai.ac.in' 
    });
    
    if (deletedUser) {
      console.log('✓ Removed user: scholaraiteam@scholarai.ac.in');
    } else {
      console.log('! User scholaraiteam@scholarai.ac.in not found');
    }

    // 2. Promote godfrey.cs23@krct.ac.in to Master Admin
    const updatedUser = await mongoose.connection.db?.collection('users').findOneAndUpdate(
      { email: 'godfrey.cs23@krct.ac.in' },
      { 
        $set: { 
          role: 'admin',
          planTier: 'PRO',
          plan: 'PRO' // Ensure compatibility with both fields
        } 
      },
      { returnDocument: 'after' }
    );

    if (updatedUser) {
      console.log('✓ Promoted godfrey.cs23@krct.ac.in to Master Admin (PRO Plan)');
    } else {
      console.log('! User godfrey.cs23@krct.ac.in not found');
    }

  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
