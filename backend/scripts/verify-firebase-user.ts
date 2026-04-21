import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing required Firebase configuration environment variables.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    }),
});

const auth = admin.auth();

async function verifyUser() {
    // We can use an environment variable or a passed-in UID/Email to fetch from Firebase
    const uid = process.env.TEST_USER_UID || 'ptNLSBU6ENgdnYE4oAJIpZxieaV2';

    try {
        console.log(`Fetching user data from Firebase for UID: ${uid}...`);
        const firebaseUser = await auth.getUser(uid);
        
        console.log('--- Firebase User Details ---');
        console.log(`Email: ${firebaseUser.email}`);
        console.log(`Display Name: ${firebaseUser.displayName}`);
        console.log(`UID: ${firebaseUser.uid}`);
        console.log(`Email Verified: ${firebaseUser.emailVerified}`);
        console.log('-----------------------------');

    } catch (error: any) {
        console.error('Error fetching user from Firebase:', error.message);
    } finally {
        process.exit(0);
    }
}

verifyUser();
