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

async function setupUser() {
    const email = 'oriongd@aras.ai';
    const password = 'Password123';
    const uid = 'ptNLSBU6ENgdnYE4oAJIpZxieaV2';

    try {
        // Try to update existing user
        await auth.updateUser(uid, {
            email,
            password,
        });
        console.log(`User ${email} updated successfully in Firebase.`);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            try {
                // Create new user
                await auth.createUser({
                    uid,
                    email,
                    password,
                    displayName: 'Orion User'
                });
                console.log(`User ${email} created successfully in Firebase with UID ${uid}.`);
            } catch (createError: any) {
                console.error('Error creating user:', createError);
            }
        } else {
            console.error('Error updating user:', error);
        }
    } finally {
        process.exit(0);
    }
}

setupUser();
