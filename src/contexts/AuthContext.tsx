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

// LocalStorage keys to guarantee user avatar permanently persists across page reloads & browser restarts
export const AVATAR_CACHE_KEY = (uid: string) => `mg_user_avatar_${uid}`;
export const AVATAR_VER_KEY = (uid: string) => `mg_user_avatar_ver_${uid}`;

/**
 * Returns the permanent fresh avatar URL for a user.
 * - Respects manual overrides if given.
 * - Synchronously uses localStorage so on F5 / page reload the fresh picture appears instantly.
 * - Preserves version timestamp `?t=...` so Google CDN never returns stale disk-cached image.
 */
export const getPersistentPhotoURL = (u: User | null, forcedUrl?: string): string | null => {
  if (!u) return null;
  if (forcedUrl) return forcedUrl;

  try {
    const cached = localStorage.getItem(AVATAR_CACHE_KEY(u.uid));
    if (cached) return cached;
  } catch {}

  const rawPhoto = u.providerData?.[0]?.photoURL || u.photoURL;
  if (!rawPhoto) return null;

  try {
    let ver = localStorage.getItem(AVATAR_VER_KEY(u.uid));
    if (!ver) {
      ver = String(Date.now());
      localStorage.setItem(AVATAR_VER_KEY(u.uid), ver);
    }
    const cleanBase = rawPhoto.replace(/[?&]t=\d+/, '');
    const separator = cleanBase.includes('?') ? '&' : '?';
    const versionedUrl = `${cleanBase}${separator}t=${ver}`;
    localStorage.setItem(AVATAR_CACHE_KEY(u.uid), versionedUrl);
    return versionedUrl;
  } catch {
    return rawPhoto;
  }
};

/**
 * Wraps User object with a Proxy so that `user.photoURL` returns the persistent, latest avatar.
 */
export const wrapUserWithPersistentPhoto = (u: User | null, forcedUrl?: string): User | null => {
  if (!u) return null;

  const persistentPhoto = getPersistentPhotoURL(u, forcedUrl);
  if (!persistentPhoto) return u;

  return new Proxy(u, {
    get(target, prop, receiver) {
      if (prop === 'photoURL') {
        return persistentPhoto;
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

        // Fetch newest photo from providerData (Google IdP) or user photoURL
        const rawPhoto = fresh.providerData?.[0]?.photoURL || fresh.photoURL;
        let freshUrl: string | null = null;

        if (rawPhoto) {
          const cleanBase = rawPhoto.replace(/[?&]t=\d+/, '');
          const separator = cleanBase.includes('?') ? '&' : '?';
          freshUrl = `${cleanBase}${separator}t=${v}`;

          // Persist in localStorage so it survives page reloads permanently
          try {
            localStorage.setItem(AVATAR_VER_KEY(fresh.uid), String(v));
            localStorage.setItem(AVATAR_CACHE_KEY(fresh.uid), freshUrl);
          } catch (e) {
            console.warn("Could not save avatar to localStorage:", e);
          }

          // Update Firebase Auth user object directly in IndexedDB / Firebase backend
          try {
            await updateProfile(fresh, { photoURL: freshUrl });
          } catch (e) {
            console.warn("Could not update Firebase Auth user profile photoURL:", e);
          }
        }

        // Set wrapped user in state
        setUser(wrapUserWithPersistentPhoto(fresh, freshUrl || undefined));

        // 3. Sync the latest photoURL to Firestore users collection
        try {
          await setDoc(doc(db, 'users', fresh.uid), {
            photoURL: freshUrl || fresh.photoURL || '',
            displayName: fresh.displayName || '',
            photoVersion: v,
            lastPhotoSync: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("Could not sync photo to Firestore:", e);
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
          setUser(wrapUserWithPersistentPhoto(cred.user));
          refreshUserProfile().catch(() => {});
        }
      })
      .catch((err) => {
        console.warn("Google redirect auth error:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // 1. Immediately wrap and set the user using persisted localStorage avatar
      // This guarantees the new photo is visible from the very first frame on page reload!
      const initialWrapped = wrapUserWithPersistentPhoto(currentUser);
      setUser(initialWrapped);

      if (currentUser) {
        let activePhoto = getPersistentPhotoURL(currentUser);

        // Automatically sync registered user document to Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);

          // Check if Firestore already has an updated photoURL
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (typeof data?.photoURL === 'string' && data.photoURL.includes('t=')) {
              if (!activePhoto || !activePhoto.includes('t=')) {
                const firestorePhoto: string = data.photoURL;
                activePhoto = firestorePhoto;
                try {
                  localStorage.setItem(AVATAR_CACHE_KEY(currentUser.uid), firestorePhoto);
                } catch {}
                setUser(wrapUserWithPersistentPhoto(currentUser, firestorePhoto));
              }
            }
          }

          // Write to Firestore - NEVER overwrite with old bare photoURL
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            email: currentUser.email?.toLowerCase() || '',
            displayName: currentUser.displayName || '',
            photoURL: activePhoto || currentUser.photoURL || '',
            lastLoginAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn("Could not sync user profile to Firestore:", err);
        }

        // If this client hasn't cached an avatar version yet, silently refresh in background once
        try {
          const hasCachedVer = localStorage.getItem(AVATAR_VER_KEY(currentUser.uid));
          if (!hasCachedVer) {
            refreshUserProfile().catch(() => {});
          }
        } catch {}
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
        setUser(wrapUserWithPersistentPhoto(userCred.user));
        refreshUserProfile().catch(() => {});
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
      setUser(wrapUserWithPersistentPhoto(userCredential.user));
      refreshUserProfile().catch(() => {});
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
