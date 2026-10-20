import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, ADMIN_UID, ADMIN_EMAIL, SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const checkAdminStatus = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      return;
    }

    const superAdmin = Boolean(
      currentUser.uid === SUPER_ADMIN_UID || 
      currentUser.uid === ADMIN_UID || 
      (SUPER_ADMIN_EMAIL && currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) ||
      (ADMIN_EMAIL && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    );

    setIsSuperAdmin(superAdmin);

    if (superAdmin) {
      setIsAdmin(true);
      return;
    }

    // Check ordinary admin role in Firestore `admins` collection
    try {
      const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
      if (adminSnap.exists() && adminSnap.data().status === 'active') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Process redirect sign-in if returning from Google redirect
    getRedirectResult(auth).catch((err) => {
      console.warn("Google redirect auth error:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Automatically sync registered user document to Firestore for user tracking & identification
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            email: currentUser.email?.toLowerCase() || '',
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            lastLoginAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn("Could not sync user profile to Firestore:", err);
        }
      }

      await checkAdminStatus(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshAdminStatus = async () => {
    await checkAdminStatus(auth.currentUser);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email?.toLowerCase() || '',
          displayName: name,
          photoURL: userCredential.user.photoURL || '',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Could not save registered user profile:", err);
      }
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    // Use full page redirect to completely eliminate popup-blocker and cross-origin cookie loss
    await signInWithRedirect(auth, provider);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin, 
      isSuperAdmin, 
      login, 
      register, 
      loginWithGoogle, 
      resetPassword, 
      logout,
      refreshAdminStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
