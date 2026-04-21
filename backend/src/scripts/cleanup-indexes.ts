import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aras';

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection failed');
    }
    
    // Cleanup Subscriptions
    const subCollection = db.collection('subscriptions');
    const subIndexes = await subCollection.indexes();
    console.log('Current Subscription Indexes:', subIndexes.map(i => i.name));

    if (subIndexes.some(i => i.name === 'stripeSubscriptionId_1')) {
      console.log('Dropping stripeSubscriptionId_1 index...');
      await subCollection.dropIndex('stripeSubscriptionId_1');
    }

    // Cleanup Users
    const userCollection = db.collection('users');
    const userIndexes = await userCollection.indexes();
    console.log('Current User Indexes:', userIndexes.map(i => i.name));

    // Optional: Drop other legacy stuff if needed
    
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanup();
