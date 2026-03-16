/**
 * seedAdmin.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot script: create (or update) the system admin account.
 *
 * What it does:
 *  1. Connects to Firebase Admin SDK using the local serviceAccountKey.json.
 *  2. Creates a Firebase Auth user with the given email + password, or updates
 *     the password if the user already exists.
 *  3. Sets the custom claim  { admin: true }  on the Firebase user so that
 *     every subsequent ID-token carries the claim and authMiddleware promotes
 *     the MongoDB role automatically.
 *  4. Upserts the MongoDB user document with role = 'admin'.
 *
 * Usage (from the backend/ directory):
 *   npx ts-node scripts/seedAdmin.ts
 *
 * Requires MONGODB_URI to be set (via .env or the shell environment).
 */

import * as path from 'path';
import dotenv from 'dotenv';

// Load .env from the backend root before anything else.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import * as admin from 'firebase-admin';
import mongoose from 'mongoose';
import { User } from '../src/models/User';

// ── Configuration ─────────────────────────────────────────────────────────────
const ADMIN_EMAIL    = 'scholaraiteam@scholarai.ac.in';
const ADMIN_PASSWORD = 'scholarai';
const ADMIN_NAME     = 'Admin';

// ── Firebase Admin SDK init ───────────────────────────────────────────────────
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(serviceAccountPath);

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function upsertFirebaseUser(): Promise<string> {
  let firebaseUid: string;

  try {
    // Try to fetch existing user first.
    const existing = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    firebaseUid = existing.uid;

    // Update password (and display name for clarity).
    await admin.auth().updateUser(firebaseUid, {
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
    });
    console.log(`✓ Firebase user updated  (uid: ${firebaseUid})`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      // Create brand-new user.
      const created = await admin.auth().createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
        emailVerified: true,
      });
      firebaseUid = created.uid;
      console.log(`✓ Firebase user created  (uid: ${firebaseUid})`);
    } else {
      throw err;
    }
  }

  // Set / overwrite the admin custom claim.
  await admin.auth().setCustomUserClaims(firebaseUid, { admin: true });
  console.log(`✓ Custom claim { admin: true } applied`);

  return firebaseUid;
}

async function upsertMongoUser(firebaseUid: string): Promise<void> {
  const result = await User.findOneAndUpdate(
    { firebaseUid },
    {
      $set: {
        firebaseUid,
        email: ADMIN_EMAIL,
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
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set in the environment.');
    await mongoose.connect(uri);
    console.log('✓ MongoDB connected');

    // Firebase + Mongo upserts
    const uid = await upsertFirebaseUser();
    await upsertMongoUser(uid);

    console.log('\n✅ Admin account ready:');
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   Role     : admin`);
    console.log('\nNote: existing sessions need a fresh login to pick up the new admin claim.');
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
