const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define a minimal schema for the update
const UserSchema = new mongoose.Schema({
  email: String,
  role: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function upgradeUser() {
  try {
    console.log('Connecting to MongoDB...');
    if (!MONGODB_URI) throw new Error('MONGODB_URI not found in .env');
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const email = 'oriongd@aras.ai';
    const result = await User.updateOne(
      { email },
      { $set: { role: 'admin' } }
    );

    if (result.matchedCount > 0) {
      console.log(`[SUCCESS] User ${email} has been upgraded to admin.`);
    } else {
      console.log(`[ERROR] User ${email} not found in database.`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

upgradeUser();
