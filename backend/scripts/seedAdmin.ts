/**
 * seedAdmin.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot script: create (or update) the system admin account directly in MongoDB.
 *
 * What it does:
 *  1. Connects to MongoDB.
 *  2. Hashes the admin password using bcrypt.
 *  3. Upserts the MongoDB user document with email, hashed password, and role = 'admin'.
 *
 * Usage (from the backend/ directory):
 *   npx ts-node scripts/seedAdmin.ts
 *
 * Requires MONGODB_URI to be set (via .env or the shell environment).
 */

import * as path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Load .env from the backend root before anything else.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../src/models/User';

// ── Configuration ─────────────────────────────────────────────────────────────
const ADMIN_EMAIL    = 'scholaraiteam@scholarai.ac.in';
const ADMIN_PASSWORD = 'scholarai';
const ADMIN_NAME     = 'Admin';

// ── Helpers ───────────────────────────────────────────────────────────────────
async function upsertMongoUser(): Promise<void> {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  
  const result = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        role: 'admin',
        lastLoginAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log(`✓ MongoDB user upserted  (id: ${result!._id}, role: ${result!.role})`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    // MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aras';
    if (!uri) throw new Error('MONGODB_URI is not set in the environment.');
    await mongoose.connect(uri);
    console.log('✓ MongoDB connected');

    await upsertMongoUser();

    console.log('\n✅ Admin account ready:');
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   Role     : admin`);
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
