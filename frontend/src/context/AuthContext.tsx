import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Resolve any pending Google redirect (e.g. page just returned from OAuth).
    // getRedirectResult returns null if no redirect is pending — that is the normal case.
    getRedirectResult(auth).catch((error) => {
      // Ignore the "no-auth-event" code which fires on a clean page load with no redirect.
      if (error?.code !== 'auth/no-auth-event') {
        console.error('Google sign-in redirect error:', error);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Read token claims to determine admin status without an extra API round-trip.
        // This requires the Firebase custom claim `admin: true` to be set for admin users
        // (via Firebase Admin SDK or Firebase Console → Users → Edit user claims).
        const tokenResult = await firebaseUser.getIdTokenResult(/* forceRefresh */ false);
        const isAdmin = tokenResult.claims['admin'] === true;

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  /**
   * Initiates Google OAuth via a full-page redirect.
   *
   * Using signInWithRedirect instead of signInWithPopup eliminates the
   * "Cross-Origin-Opener-Policy would block the window.close call" warning
   * that Chrome emits when a cross-origin popup (accounts.google.com) tries
   * to close itself. Redirect-based auth has no popup and is therefore
   * unaffected by COOP policies on the hosting page.
   */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // Page navigates away here; execution resumes after the user returns.
    // onAuthStateChanged + getRedirectResult (above) handle the result.
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
