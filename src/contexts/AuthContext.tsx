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
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
  photoVersion: number;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGoogleCredential: (idToken: string) => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: Ensure Google/Gmail avatar URL always bypasses browser HTTP cache when photo changes
const wrapUserWithFreshPhoto = (u: User | null, v: number): User | null => {
  if (!u) return null;
  const rawPhoto = u.photoURL;
  if (!rawPhoto) return u;

  // Format with cache-busting query parameter so the browser immediately fetches updated picture
  const cleanBase = rawPhoto.replace(/[?&]t=\d+/, '');
  const separator = cleanBase.includes('?') ? '&' : '?';
  const freshPhoto = `${cleanBase}${separator}t=${v}`;

  return new Proxy(u, {
    get(target, prop, receiver) {
      if (prop === 'photoURL') {
        return freshPhoto;
      }
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      return val;
    }
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [photoVersion, setPhotoVersion] = useState<number>(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isViewer, setIsViewer] = useState(false);

  // Instant real-time Google/Gmail profile refresher
  const refreshUserProfile = async () => {
    const current = auth.currentUser;
    if (!current) return;
    try {
      // 1. Force ID token refresh from Google OAuth provider to fetch fresh IdP claims & photo
      await current.getIdToken(true);
      // 2. Reload Firebase User profile
      await current.reload();

      const fresh = auth.currentUser;
      if (fresh) {
        const v = Date.now();
        setPhotoVersion(v);
        setUser(wrapUserWithFreshPhoto(fresh, v));

        // 3. Sync the latest photoURL to Firestore users collection
        if (fresh.photoURL) {
          try {
            await setDoc(doc(db, 'users', fresh.uid), {
              photoURL: fresh.photoURL,
              displayName: fresh.displayName || '',
              lastPhotoSync: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            console.warn("Could not sync photo to Firestore:", e);
          }
        }
      }
    } catch (err) {
      console.warn("Could not refresh user profile from Google:", err);
    }
  };

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
          const v = Date.now();
          setPhotoVersion(v);
          setUser(wrapUserWithFreshPhoto(cred.user, v));
        }
      })
      .catch((err) => {
        console.warn("Google redirect auth error:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const v = Date.now();
      setPhotoVersion(v);
      setUser(wrapUserWithFreshPhoto(currentUser, v));

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

    // 1. Instant sync when user switches back to this tab (e.g. after changing Gmail photo in another tab or window)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && auth.currentUser) {
        refreshUserProfile();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // 2. Periodic gentle background sync every 25 seconds while tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && auth.currentUser) {
        refreshUserProfile();
      }
    }, 25000);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      clearInterval(interval);
    };
  }, []);

  // 3. Realtime Firestore sync for cross-device/instant profile updates
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const unsubDoc = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.photoURL && auth.currentUser && data.photoURL !== auth.currentUser.photoURL) {
          const v = Date.now();
          setPhotoVersion(v);
          setUser(wrapUserWithFreshPhoto(auth.currentUser, v));
        }
      }
    }, (err) => {
      console.warn("User doc snapshot error:", err);
    });

    return () => unsubDoc();
  }, [user?.uid]);

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
      photoVersion,
      login, 
      register, 
      loginWithGoogle, 
      loginWithGoogleCredential,
      resetPassword, 
      logout,
      refreshAdminStatus,
      refreshUserProfile
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
