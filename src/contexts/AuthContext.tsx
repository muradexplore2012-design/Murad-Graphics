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
  signInWithCredential,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, ADMIN_UID, ADMIN_EMAIL, SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL } from '../lib/firebase';

export type AdminRole = 'owner' | 'manager' | 'viewer';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminRole: AdminRole | null;
  isOwner: boolean;
  isManager: boolean;
  isViewer: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleCredential: (idToken: string) => Promise<UserCredential>;
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
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isViewer, setIsViewer] = useState(false);

  const checkAdminStatus = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setAdminRole(null);
      setIsOwner(false);
      setIsManager(false);
      setIsViewer(false);
      return;
    }

    const emailLower = currentUser.email?.toLowerCase() || '';

    // Root Super Admin / Designated Owner authority
    const isRootOwner = Boolean(
      currentUser.uid === SUPER_ADMIN_UID || 
      currentUser.uid === ADMIN_UID || 
      (SUPER_ADMIN_EMAIL && emailLower === SUPER_ADMIN_EMAIL.toLowerCase()) ||
      (ADMIN_EMAIL && emailLower === ADMIN_EMAIL.toLowerCase()) ||
      emailLower === 'muradrahman2026@gmail.com'
    );

    if (isRootOwner) {
      setIsAdmin(true);
      setIsSuperAdmin(true);
      setAdminRole('owner');
      setIsOwner(true);
      setIsManager(false);
      setIsViewer(false);
      return;
    }

    // Check role in Firestore `admins` collection
    try {
      const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
      if (adminSnap.exists() && adminSnap.data().status === 'active') {
        const rawRole = (adminSnap.data().role || 'manager').toLowerCase();
        setIsAdmin(true);
        if (rawRole === 'owner' || rawRole === 'super_admin') {
          setIsSuperAdmin(true);
          setAdminRole('owner');
          setIsOwner(true);
          setIsManager(false);
          setIsViewer(false);
        } else if (rawRole === 'viewer') {
          setIsSuperAdmin(false);
          setAdminRole('viewer');
          setIsOwner(false);
          setIsManager(false);
          setIsViewer(true);
        } else {
          // manager or legacy admin
          setIsSuperAdmin(false);
          setAdminRole('manager');
          setIsOwner(false);
          setIsManager(true);
          setIsViewer(false);
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminRole(null);
        setIsOwner(false);
        setIsManager(false);
        setIsViewer(false);
      }
    } catch {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setAdminRole(null);
      setIsOwner(false);
      setIsManager(false);
      setIsViewer(false);
    }
  };

  useEffect(() => {
    // Process redirect sign-in if returning from Google redirect
    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user) {
          setUser(cred.user);
        }
      })
      .catch((err) => {
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
    try {
      const userCred = await signInWithPopup(auth, provider);
      if (userCred?.user) {
        setUser(userCred.user);
      }
    } catch (err: any) {
      console.warn("Google popup encounter, checking redirect fallback:", err);
      if (
        err.code === 'auth/cancelled-popup-request' ||
        err.code === 'auth/popup-closed-by-user'
      ) {
        // User closed or cancelled popup intentionally, do not force redirect
        return;
      }
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  };

  const loginWithGoogleCredential = async (idToken: string): Promise<UserCredential> => {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    if (userCredential.user) {
      setUser(userCredential.user);
    }
    return userCredential;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setAdminRole(null);
    setIsOwner(false);
    setIsManager(false);
    setIsViewer(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin, 
      isSuperAdmin, 
      adminRole,
      isOwner,
      isManager,
      isViewer,
      login, 
      register, 
      loginWithGoogle, 
      loginWithGoogleCredential,
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
