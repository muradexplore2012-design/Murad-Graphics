import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  writeBatch
} from "firebase/firestore";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { db, storage, SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, ADMIN_EMAIL } from "../lib/firebase";
import { 
  Product, 
  Category, 
  Order, 
  DownloadEntitlement, 
  Coupon, 
  Review, 
  Banner, 
  SiteSettings, 
  AuditLog,
  AdminMember 
} from "../types";

// ==================== DEFAULT SETTINGS ====================
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "Murad Graphics",
  siteDescription: "A digital marketplace for graphic design resources, editable design files, software and apps.",
  phone: "01566088159",
  email: "muradrahman2026@gmail.com",
  address: "Dhaka, Bangladesh",
  whatsapp: "01566088159",
  currency: "BDT",
  timezone: "Asia/Dhaka",
  defaultLicensePolicy: "All digital items purchased or downloaded from Murad Graphics are licensed for personal and commercial client projects. Resale, sub-licensing, or redistribution of original editable source files is strictly prohibited.",
  defaultRefundPolicy: "Due to the irreversible nature of digital downloads, sales of downloadable graphics and software are generally final once the download entitlement is activated. However, if a file is demonstrably corrupt or broken and our support team cannot provide a working version, a refund or credit will be evaluated.",
  termsAndConditions: "By using Murad Graphics and downloading digital assets, you agree to comply with our licensing terms, copyright guidelines, and acceptable use policy.",
  privacyPolicy: "We respect your privacy. Murad Graphics collects only the minimum information required for account authentication and digital purchase order verification.",
  aboutText: "Murad Graphics is a premier Bangladeshi digital assets marketplace dedicated to empowering creators, agencies, freelancers, and businesses with high-quality graphic resources, templates, and software solutions.",
  faqList: [
    { question: "How do I download my purchased items?", answer: "Once your payment is verified or you click claim on a free item, navigate to your Account > Downloads to access your files at any time." },
    { question: "Can I use these designs for client projects?", answer: "Yes! Standard commercial use for client work is included. You may not re-distribute the raw editable files for sale." },
    { question: "What formats are provided?", answer: "Our products support AI, EPS, PSD, SVG, PNG, PDF, ZIP bundles, and software installers as specified on each product's page." },
    { question: "How does payment verification work in Bangladesh?", answer: "We support bKash, Nagad, and Rocket mobile banking. Once you submit your order and transaction ID, the order is verified and download access is instantly granted." }
  ],
  socialLinks: [
    { id: "1", name: "YouTube", url: "https://www.youtube.com/channel/UCDP9PD8OEpJkq63hMVNCYSg", icon: "youtube", isVisible: true, order: 1 },
    { id: "2", name: "Facebook", url: "https://www.facebook.com/MuradGraphics", icon: "facebook", isVisible: true, order: 2 },
    { id: "3", name: "WhatsApp", url: "https://wa.me/8801566088159", icon: "whatsapp", isVisible: true, order: 3 }
  ]
};

// ==================== FAST CLIENT-SIDE CACHE & DEDUPLICATION ====================
interface CacheItem<T> {
  data: T;
  time: number;
}
const cacheStore = new Map<string, CacheItem<any>>();
const inFlightPromises = new Map<string, Promise<any>>();

export const fastCacheGet = <T>(key: string, maxAgeMs = 120_000): T | null => {
  const mem = cacheStore.get(key);
  if (mem && (Date.now() - mem.time < maxAgeMs)) {
    return mem.data as T;
  }
  try {
    const raw = sessionStorage.getItem(`mg_cache_${key}`) || localStorage.getItem(`mg_cache_${key}`);
    if (raw) {
      const parsed: CacheItem<T> = JSON.parse(raw);
      if (Date.now() - parsed.time < maxAgeMs) {
        cacheStore.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {}
  return null;
};

export const fastCacheSet = <T>(key: string, data: T): void => {
  const item: CacheItem<T> = { data, time: Date.now() };
  cacheStore.set(key, item);
  try {
    const str = JSON.stringify(item);
    sessionStorage.setItem(`mg_cache_${key}`, str);
    localStorage.setItem(`mg_cache_${key}`, str);
  } catch {}
};

export const fastCacheInvalidate = (prefix?: string): void => {
  if (!prefix) {
    cacheStore.clear();
    try {
      Object.keys(sessionStorage).forEach(k => { if (k.startsWith('mg_cache_')) sessionStorage.removeItem(k); });
      Object.keys(localStorage).forEach(k => { if (k.startsWith('mg_cache_')) localStorage.removeItem(k); });
    } catch {}
    return;
  }
  for (const k of cacheStore.keys()) {
    if (k.startsWith(prefix)) cacheStore.delete(k);
  }
  try {
    Object.keys(sessionStorage).forEach(k => { if (k.startsWith(`mg_cache_${prefix}`)) sessionStorage.removeItem(k); });
    Object.keys(localStorage).forEach(k => { if (k.startsWith(`mg_cache_${prefix}`)) localStorage.removeItem(k); });
  } catch {}
};

// ==================== SITE SETTINGS ====================
export const getSiteSettings = async (): Promise<SiteSettings> => {
  const cached = fastCacheGet<SiteSettings>('site_settings', 180_000);
  if (cached) return cached;

  if (inFlightPromises.has('site_settings')) {
    return inFlightPromises.get('site_settings')!;
  }

  const promise = (async () => {
    try {
      const docRef = doc(db, "settings", "general");
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = { ...DEFAULT_SITE_SETTINGS, ...snapshot.data() } as SiteSettings;
        fastCacheSet('site_settings', data);
        return data;
      }
    } catch (err) {
      console.warn("Could not fetch settings from Firestore, fallback to defaults", err);
    } finally {
      inFlightPromises.delete('site_settings');
    }
    return DEFAULT_SITE_SETTINGS;
  })();

  inFlightPromises.set('site_settings', promise);
  return promise;
};

export const updateSiteSettings = async (settings: Partial<SiteSettings>): Promise<void> => {
  const docRef = doc(db, "settings", "general");
  await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  fastCacheInvalidate('site_settings');
};

// ==================== AUDIT LOGS ====================
export const recordAuditLog = async (log: Omit<AuditLog, "id" | "timestamp">) => {
  try {
    await addDoc(collection(db, "auditLogs"), {
      ...log,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};

export const getAuditLogs = async (limitCount = 20): Promise<AuditLog[]> => {
  try {
    const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
  } catch {
    return [];
  }
};

// ==================== PRODUCTS ====================
export const getProducts = async (options?: {
  categoryId?: string;
  isFree?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  limitCount?: number;
  onlyActive?: boolean;
}): Promise<Product[]> => {
  try {
    let allProducts: Product[];

    if (options?.onlyActive !== false) {
      // Check fast cache for active products
      const cached = fastCacheGet<Product[]>('active_products', 60_000);
      if (cached) {
        allProducts = cached;
      } else if (inFlightPromises.has('active_products')) {
        allProducts = await inFlightPromises.get('active_products')!;
      } else {
        const fetchPromise = (async () => {
          const snap = await getDocs(query(collection(db, "products"), where("isActive", "==", true)));
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Product));
          fastCacheSet('active_products', list);
          return list;
        })().finally(() => {
          inFlightPromises.delete('active_products');
        });

        inFlightPromises.set('active_products', fetchPromise);
        allProducts = await fetchPromise;
      }
    } else {
      const snap = await getDocs(collection(db, "products"));
      allProducts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Product));
    }

    let products = [...allProducts];

    if (options?.categoryId) {
      products = products.filter(p => p.categoryId === options.categoryId);
    }
    if (options?.isFree !== undefined) {
      products = products.filter(p => p.isFree === options.isFree);
    }
    if (options?.isFeatured) {
      products = products.filter(p => p.isFeatured === true);
    }
    if (options?.isNewArrival) {
      products = products.filter(p => p.isNewArrival === true);
    }

    // Sort by createdAt descending
    products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    if (options?.limitCount) {
      products = products.slice(0, options.limitCount);
    }

    return products;
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
};

export const getAllProductsAdmin = async (): Promise<Product[]> => {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  } catch (err) {
    console.error("Error fetching admin products:", err);
    return [];
  }
};

export const getProductBySlug = async (slugOrId: string): Promise<Product | null> => {
  if (!slugOrId) return null;
  const rawSlug = slugOrId.trim();
  let decodedSlug = rawSlug;
  try {
    decodedSlug = decodeURIComponent(rawSlug).trim();
  } catch {}

  // 1. Instant Cache Lookup (0ms response if products are already cached in session/memory)
  try {
    const cachedProducts = fastCacheGet<Product[]>('active_products', 180_000);
    if (cachedProducts && cachedProducts.length > 0) {
      const found = cachedProducts.find(
        p => (p.slug && (p.slug === rawSlug || p.slug === decodedSlug || p.slug.toLowerCase() === rawSlug.toLowerCase() || p.slug.toLowerCase() === decodedSlug.toLowerCase())) ||
             p.id === rawSlug ||
             p.id === decodedSlug
      );
      if (found) return found;
    }
  } catch {}

  // 2. Direct Document ID lookup (in case slugOrId is the document ID)
  try {
    const docRef = doc(db, "products", rawSlug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Product;
    }
  } catch (err) {
    console.warn("Direct product getDoc failed:", err);
  }

  // 3. Firestore Query by slug (both raw and decoded)
  try {
    const q1 = query(collection(db, "products"), where("slug", "==", rawSlug), limit(1));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const docData = snap1.docs[0];
      return { id: docData.id, ...docData.data() } as Product;
    }

    if (decodedSlug !== rawSlug) {
      const q2 = query(collection(db, "products"), where("slug", "==", decodedSlug), limit(1));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const docData = snap2.docs[0];
        return { id: docData.id, ...docData.data() } as Product;
      }
    }
  } catch (err) {
    console.warn("Firestore slug query failed:", err);
  }

  // 4. Fallback: Fetch all active products and match client-side (handles case-insensitivity & special chars)
  try {
    const all = await getProducts({ onlyActive: true });
    const found = all.find(
      p => (p.slug && (p.slug === rawSlug || p.slug === decodedSlug || p.slug.toLowerCase() === rawSlug.toLowerCase() || p.slug.toLowerCase() === decodedSlug.toLowerCase())) ||
           p.id === rawSlug ||
           p.id === decodedSlug
    );
    if (found) return found;
  } catch (err) {
    console.error("All products fallback search failed:", err);
  }

  return null;
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, "products", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Product;
    }
  } catch (err) {
    console.error("Error fetching product by ID:", err);
  }
  return null;
};

export const cleanUndefined = <T extends Record<string, any>>(obj: T): T => {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        cleaned[key] = cleanUndefined(val);
      } else {
        cleaned[key] = val;
      }
    }
  });
  return cleaned as T;
};

export const createProduct = async (productData: Omit<Product, "id" | "createdAt" | "updatedAt" | "downloadCount" | "purchaseCount">): Promise<string> => {
  const now = new Date().toISOString();
  const cleanedData = cleanUndefined(productData);
  const docRef = await addDoc(collection(db, "products"), {
    ...cleanedData,
    downloadCount: 0,
    purchaseCount: 0,
    createdAt: now,
    updatedAt: now
  });
  fastCacheInvalidate('active_products');
  return docRef.id;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
  const docRef = doc(db, "products", id);
  const cleanedUpdates = cleanUndefined(updates);
  await updateDoc(docRef, {
    ...cleanedUpdates,
    updatedAt: new Date().toISOString()
  });
  fastCacheInvalidate('active_products');
};

export const deleteProduct = async (id: string): Promise<void> => {
  const docRef = doc(db, "products", id);
  await deleteDoc(docRef);
  fastCacheInvalidate('active_products');
};

// ==================== CATEGORIES ====================
export const getCategories = async (onlyActive = true): Promise<Category[]> => {
  const cacheKey = onlyActive ? 'categories_active' : 'categories_all';
  const cached = fastCacheGet<Category[]>(cacheKey, 120_000);
  if (cached) return cached;

  if (inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      const snap = await getDocs(collection(db, "categories"));
      let list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Category));
      if (onlyActive) {
        list = list.filter(c => c.isActive !== false);
      }
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      fastCacheSet(cacheKey, list);
      return list;
    } catch (err) {
      console.error("Error fetching categories:", err);
      return [];
    } finally {
      inFlightPromises.delete(cacheKey);
    }
  })();

  inFlightPromises.set(cacheKey, promise);
  return promise;
};

export const createCategory = async (catData: Omit<Category, "id" | "createdAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, "categories"), {
    ...catData,
    createdAt: new Date().toISOString()
  });
  fastCacheInvalidate('categories_');
  return docRef.id;
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<void> => {
  const docRef = doc(db, "categories", id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
  fastCacheInvalidate('categories_');
};

export const deleteCategory = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "categories", id));
  fastCacheInvalidate('categories_');
};

// ==================== ORDERS & CHECKOUT ====================
export const createOrder = async (orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "orderNumber">): Promise<Order> => {
  const now = new Date().toISOString();
  const orderNumber = `MG-${Date.now().toString().slice(-6)}`;
  
  const payload: Omit<Order, "id"> = {
    ...orderData,
    orderNumber,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(db, "orders"), payload);
  const createdOrder = { id: docRef.id, ...payload };

  // If this order is free checkout or immediately verified, generate digital download entitlements immediately
  if (orderData.paymentStatus === 'verified' || orderData.subtotal === 0) {
    await grantEntitlementsForOrder(createdOrder);
  }

  return createdOrder;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  } catch (err) {
    console.error("Error fetching user orders:", err);
    return [];
  }
};

export const getAllOrdersAdmin = async (): Promise<Order[]> => {
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  } catch (err) {
    console.error("Error fetching all orders for admin:", err);
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: Order["paymentStatus"], adminNotes?: string): Promise<void> => {
  const docRef = doc(db, "orders", orderId);
  const now = new Date().toISOString();
  
  const updates: any = {
    paymentStatus: status,
    updatedAt: now
  };

  if (status === 'verified') {
    updates.verifiedAt = now;
  }
  if (adminNotes) {
    updates.adminNotes = adminNotes;
  }

  await updateDoc(docRef, updates);

  // If status is verified, grant entitlements and increment purchase counts
  if (status === 'verified') {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const order = { id: snap.id, ...snap.data() } as Order;
      await grantEntitlementsForOrder(order);
    }
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  await deleteDoc(doc(db, "orders", orderId));
};

export const createAdminManualOrder = async (orderData: Partial<Order>): Promise<string> => {
  const orderNumber = `MG-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();
  const newOrder: any = {
    orderNumber,
    userId: orderData.userId || 'manual-admin-order',
    userEmail: orderData.userEmail || '',
    customerName: orderData.customerName || 'Direct Customer',
    customerPhone: orderData.customerPhone || '',
    items: orderData.items || [],
    subtotal: orderData.subtotal || 0,
    discount: orderData.discount || 0,
    total: orderData.total || 0,
    currency: 'BDT',
    paymentStatus: orderData.paymentStatus || 'verified',
    paymentMethod: orderData.paymentMethod || 'manual',
    transactionId: orderData.transactionId || 'ADMIN-DIRECT',
    createdAt: now,
    updatedAt: now
  };
  const docRef = await addDoc(collection(db, "orders"), newOrder);
  if (newOrder.paymentStatus === 'verified' && newOrder.items?.length > 0) {
    await grantEntitlementsForOrder({ id: docRef.id, ...newOrder });
  }
  return docRef.id;
};

// ==================== ENTITLEMENTS & DOWNLOADS ====================
export const grantEntitlementsForOrder = async (order: Order) => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const item of order.items) {
    const entitlementDocRef = doc(collection(db, "downloadEntitlements"));
    batch.set(entitlementDocRef, {
      userId: order.userId,
      userEmail: order.userEmail,
      productId: item.productId,
      productName: item.name,
      productSlug: item.slug,
      thumbnail: item.thumbnail,
      orderId: order.id,
      isFree: item.isFree,
      zipPassword: item.zipPassword || '',
      accessGrantedAt: now,
      downloadCount: 0,
      status: 'active'
    });

    // Increment product purchase count
    const productRef = doc(db, "products", item.productId);
    batch.update(productRef, {
      purchaseCount: increment(1)
    });
  }

  await batch.commit();
};

export const grantFreeEntitlement = async (user: { uid: string; email: string }, product: Product): Promise<void> => {
  // Check if entitlement already exists
  const q = query(
    collection(db, "downloadEntitlements"),
    where("userId", "==", user.uid),
    where("productId", "==", product.id),
    limit(1)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    await addDoc(collection(db, "downloadEntitlements"), {
      userId: user.uid,
      userEmail: user.email,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      thumbnail: product.thumbnail,
      isFree: true,
      zipPassword: product.zipPassword || '',
      accessGrantedAt: new Date().toISOString(),
      downloadCount: 0,
      status: 'active'
    });

    // Increment download/claim count
    const productRef = doc(db, "products", product.id);
    await updateDoc(productRef, {
      downloadCount: increment(1)
    });
  }
};

export const getUserEntitlements = async (userId: string): Promise<DownloadEntitlement[]> => {
  try {
    const q = query(
      collection(db, "downloadEntitlements"),
      where("userId", "==", userId),
      where("status", "==", "active"),
      orderBy("accessGrantedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DownloadEntitlement));
  } catch (err) {
    console.error("Error fetching user entitlements:", err);
    return [];
  }
};

export const checkUserEntitlement = async (userId: string, productId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, "downloadEntitlements"),
      where("userId", "==", userId),
      where("productId", "==", productId),
      where("status", "==", "active"),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
};

export const recordDownloadEvent = async (entitlementId: string, productId: string, userId: string): Promise<void> => {
  try {
    const entRef = doc(db, "downloadEntitlements", entitlementId);
    await updateDoc(entRef, {
      downloadCount: increment(1),
      lastDownloadedAt: new Date().toISOString()
    });

    const prodRef = doc(db, "products", productId);
    await updateDoc(prodRef, {
      downloadCount: increment(1)
    });

    // Also record in downloadEvents for audit
    await addDoc(collection(db, "downloadEvents"), {
      entitlementId,
      productId,
      userId,
      downloadedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to record download event:", e);
  }
};

// ==================== BANNERS ====================
export const getBanners = async (onlyActive = true): Promise<Banner[]> => {
  const cacheKey = onlyActive ? 'banners_active' : 'banners_all';
  const cached = fastCacheGet<Banner[]>(cacheKey, 120_000);
  if (cached) return cached;

  if (inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      const snap = await getDocs(collection(db, "banners"));
      let banners = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Banner));
      if (onlyActive) {
        banners = banners.filter((b) => b.isActive !== false);
      }
      banners.sort((a, b) => (a.order || 0) - (b.order || 0));
      fastCacheSet(cacheKey, banners);
      return banners;
    } catch (err) {
      console.error("Error fetching banners:", err);
      return [];
    } finally {
      inFlightPromises.delete(cacheKey);
    }
  })();

  inFlightPromises.set(cacheKey, promise);
  return promise;
};

export const createBanner = async (banner: Omit<Banner, "id" | "createdAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, "banners"), {
    ...banner,
    createdAt: new Date().toISOString()
  });
  fastCacheInvalidate('banners_');
  return docRef.id;
};

export const updateBanner = async (id: string, updates: Partial<Banner>): Promise<void> => {
  await updateDoc(doc(db, "banners", id), updates);
  fastCacheInvalidate('banners_');
};

export const deleteBanner = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "banners", id));
  fastCacheInvalidate('banners_');
};

// ==================== COUPONS ====================
export const getCoupons = async (): Promise<Coupon[]> => {
  try {
    const snap = await getDocs(collection(db, "coupons"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon));
  } catch {
    return [];
  }
};

export const createCoupon = async (coupon: Omit<Coupon, "id" | "createdAt" | "usedCount">): Promise<string> => {
  const docRef = await addDoc(collection(db, "coupons"), {
    ...coupon,
    usedCount: 0,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateCoupon = async (id: string, updates: Partial<Coupon>): Promise<void> => {
  await updateDoc(doc(db, "coupons", id), updates);
};

export const deleteCoupon = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "coupons", id));
};

export const validateCouponCode = async (code: string, subtotal: number): Promise<{ valid: boolean; discountAmount: number; coupon?: Coupon; error?: string }> => {
  try {
    const q = query(collection(db, "coupons"), where("code", "==", code.trim().toUpperCase()), where("isActive", "==", true), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      return { valid: false, discountAmount: 0, error: "Invalid coupon code." };
    }
    const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon;
    
    // Check expiry
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return { valid: false, discountAmount: 0, error: "This coupon has expired." };
    }
    // Check min subtotal
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      return { valid: false, discountAmount: 0, error: `Minimum order amount of ৳${coupon.minSubtotal} required for this coupon.` };
    }
    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, discountAmount: 0, error: "Coupon usage limit reached." };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    return { valid: true, discountAmount: Math.round(discount), coupon };
  } catch (e: any) {
    return { valid: false, discountAmount: 0, error: e.message || "Failed to validate coupon." };
  }
};

// ==================== REVIEWS ====================
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", productId),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
  } catch {
    return [];
  }
};

export const getAllReviewsAdmin = async (): Promise<Review[]> => {
  try {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
  } catch {
    return [];
  }
};

export const createReview = async (review: Omit<Review, "id" | "createdAt" | "status">): Promise<void> => {
  await addDoc(collection(db, "reviews"), {
    ...review,
    status: 'pending', // Requires admin approval to maintain quality and prevent spam
    createdAt: new Date().toISOString()
  });
};

export const updateReviewStatus = async (reviewId: string, status: Review["status"]): Promise<void> => {
  await updateDoc(doc(db, "reviews", reviewId), { status });
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  await deleteDoc(doc(db, "reviews", reviewId));
};

export const createAdminReview = async (review: Omit<Review, "id" | "createdAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, "reviews"), {
    ...review,
    status: review.status || 'approved',
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

// ==================== STORAGE UPLOAD HELPERS ====================
export const compressImageToDataUrl = (file: File, maxWidth = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const uploadImageWithFallback = async (
  file: File,
  storagePath: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // 1. Prepare compressed data url first as guaranteed instant fallback
  let fallbackDataUrl = '';
  try {
    fallbackDataUrl = await compressImageToDataUrl(file);
  } catch (err) {
    console.warn("Failed to compress image:", err);
  }

  // 2. Try Firebase Storage with a 3.5s timeout
  return new Promise((resolve) => {
    let resolved = false;

    // Timeout guard: if Firebase Storage is inactive or hanging, fallback smoothly
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (onProgress) onProgress(100);
        if (fallbackDataUrl) {
          resolve(fallbackDataUrl);
        } else {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        }
      }
    }, 3500);

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (!resolved) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          }
        },
        (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            console.warn("Firebase Storage upload error, using local fallback:", error);
            if (onProgress) onProgress(100);
            resolve(fallbackDataUrl);
          }
        },
        async () => {
          if (!resolved) {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolved = true;
              clearTimeout(timer);
              if (onProgress) onProgress(100);
              resolve(downloadUrl);
            } catch {
              if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                if (onProgress) onProgress(100);
                resolve(fallbackDataUrl);
              }
            }
          }
        }
      );
    } catch (e) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        if (onProgress) onProgress(100);
        resolve(fallbackDataUrl);
      }
    }
  });
};

export const uploadFileWithProgress = (
  file: File, 
  storagePath: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });
};

export const deleteStorageFile = async (storagePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn("Storage deletion error:", err);
  }
};

export const syncAdminWhitelist = async (adminEmails: string[]): Promise<void> => {
  try {
    const cleanList = Array.from(new Set(
      [
        SUPER_ADMIN_EMAIL.toLowerCase(),
        ADMIN_EMAIL ? ADMIN_EMAIL.toLowerCase() : '',
        ...adminEmails.map(e => e.trim().toLowerCase())
      ].filter(Boolean)
    ));

    await setDoc(doc(db, "settings", "adminWhitelist"), {
      emails: cleanList,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Could not sync admin whitelist:", err);
  }
};

export const checkIsAdminEmail = async (rawEmail: string): Promise<boolean> => {
  const cleanEmail = rawEmail.trim().toLowerCase();
  if (!cleanEmail) return false;

  // 1. Root Super Admin & Primary Admin
  if (
    cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() ||
    (ADMIN_EMAIL && cleanEmail === ADMIN_EMAIL.toLowerCase())
  ) {
    return true;
  }

  // 2. Known default admin from configuration
  if (cleanEmail === 'muradrahman2026@gmail.com') {
    return true;
  }

  // 3. Check public settings adminWhitelist document (always accessible under /settings/*)
  try {
    const whitelistDoc = await getDoc(doc(db, "settings", "adminWhitelist"));
    if (whitelistDoc.exists()) {
      const emails: string[] = whitelistDoc.data()?.emails || [];
      if (emails.map(e => e.toLowerCase()).includes(cleanEmail)) {
        return true;
      }
    }
  } catch (err) {
    console.warn("Could not check settings/adminWhitelist:", err);
  }

  // 4. Check Firestore `admins` collection directly
  try {
    const q = query(collection(db, "admins"), where("email", "==", cleanEmail), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      if (data.status === 'active') {
        return true;
      }
    }
  } catch (err) {
    console.warn("Could not query admins collection directly:", err);
  }

  return false;
};

// ==================== ADMIN & SUPER ADMIN MANAGEMENT ====================
export const getAdminList = async (): Promise<AdminMember[]> => {
  const admins: AdminMember[] = [];

  // Always include the designated root Super Admin at the top
  admins.push({
    id: SUPER_ADMIN_UID,
    uid: SUPER_ADMIN_UID,
    email: SUPER_ADMIN_EMAIL,
    displayName: "Murad Graphics Super Admin",
    role: "super_admin",
    addedAt: "2026-01-01T00:00:00.000Z",
    status: "active"
  });

  try {
    const snap = await getDocs(collection(db, "admins"));
    snap.docs.forEach((d) => {
      const data = d.data() as Partial<AdminMember>;
      // Skip if it duplicates the Super Admin
      if (d.id !== SUPER_ADMIN_UID && data.email !== SUPER_ADMIN_EMAIL) {
        admins.push({
          id: d.id,
          uid: data.uid || d.id,
          email: data.email || '',
          displayName: data.displayName || 'Administrator',
          role: 'admin',
          addedBy: data.addedBy || '',
          addedByEmail: data.addedByEmail || '',
          addedAt: data.addedAt || new Date().toISOString(),
          status: 'active'
        });
      }
    });

    // Background sync active admins to public whitelist document
    const activeEmails = admins.filter(a => a.status === 'active').map(a => a.email);
    syncAdminWhitelist(activeEmails).catch(() => {});
  } catch (err) {
    console.warn("Could not fetch admins collection:", err);
  }

  return admins;
};

export const makeAdminByEmail = async (
  emailToPromote: string,
  caller: { uid: string; email: string | null }
): Promise<AdminMember> => {
  const cleanEmail = emailToPromote.trim().toLowerCase();

  // Validate caller authorization: MUST be Super Admin
  const isCallerSuperAdmin = 
    caller.uid === SUPER_ADMIN_UID || 
    caller.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  if (!isCallerSuperAdmin) {
    throw new Error("Unauthorized: Only the designated Super Admin has permission to appoint administrators.");
  }

  // Prevent promoting Super Admin or self
  if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() || caller.email?.toLowerCase() === cleanEmail) {
    throw new Error("This account is already the Super Admin.");
  }

  // Search existing registered account in Firestore `users` collection
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", cleanEmail), limit(1));
  const userQuerySnap = await getDocs(q);

  if (userQuerySnap.empty) {
    throw new Error("This email has not signed in to the website yet. The user must sign up or log in to Murad Graphics at least once before they can be promoted to an administrator.");
  }

  const userDoc = userQuerySnap.docs[0];
  const userData = userDoc.data();
  const targetUid = userDoc.id;

  // Check if target user is already in `admins` collection
  const adminDocSnap = await getDoc(doc(db, "admins", targetUid));
  if (adminDocSnap.exists() && adminDocSnap.data().status === 'active') {
    throw new Error("This user is already an administrator.");
  }

  const newAdminData: AdminMember = {
    id: targetUid,
    uid: targetUid,
    email: cleanEmail,
    displayName: userData.displayName || cleanEmail.split('@')[0],
    role: "admin",
    addedBy: caller.uid,
    addedByEmail: caller.email || '',
    addedAt: new Date().toISOString(),
    status: "active"
  };

  // Write to Firestore `admins/{targetUid}`
  await setDoc(doc(db, "admins", targetUid), newAdminData);

  // Sync to whitelist
  syncAdminWhitelist([cleanEmail]).catch(() => {});

  // Record immutable audit log
  await recordAuditLog({
    adminUid: caller.uid,
    adminEmail: caller.email || '',
    action: 'GRANT_ADMIN_ROLE',
    targetType: 'ADMIN_ROLE',
    targetId: targetUid,
    details: { promotedEmail: cleanEmail, promotedName: newAdminData.displayName }
  });

  return newAdminData;
};

export const revokeAdmin = async (
  targetAdminUid: string,
  caller: { uid: string; email: string | null }
): Promise<void> => {
  // Validate caller authorization: MUST be Super Admin
  const isCallerSuperAdmin = 
    caller.uid === SUPER_ADMIN_UID || 
    caller.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  if (!isCallerSuperAdmin) {
    throw new Error("Unauthorized: Only the designated Super Admin has permission to revoke administrators.");
  }

  // Guard against demoting or removing Super Admin
  if (targetAdminUid === SUPER_ADMIN_UID) {
    throw new Error("Permission Denied: The root Super Admin cannot be removed or demoted.");
  }

  // Delete admin document from `admins/{targetAdminUid}`
  await deleteDoc(doc(db, "admins", targetAdminUid));

  // Refresh admin list to update whitelist
  getAdminList().catch(() => {});

  // Record immutable audit log
  await recordAuditLog({
    adminUid: caller.uid,
    adminEmail: caller.email || '',
    action: 'REVOKE_ADMIN_ROLE',
    targetType: 'ADMIN_ROLE',
    targetId: targetAdminUid,
  });
};
