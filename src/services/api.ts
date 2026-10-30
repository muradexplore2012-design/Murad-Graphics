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
import { db, storage, SUPER_ADMIN_UID, SUPER_ADMIN_EMAIL, ADMIN_UID, ADMIN_EMAIL } from "../lib/firebase";
import { 
  Product, 
  Category, 
  Order,
  OrderPaymentStatus, 
  DownloadEntitlement, 
  Coupon, 
  Review, 
  Banner, 
  SiteSettings, 
  AuditLog,
  AdminMember,
  AdminRole 
} from "../types";

// ==================== DEFAULT SETTINGS ====================
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "Vyrqonix",
  siteSubtitle: "Your Digital World",
  siteTitle: "Vyrqonix | Graphic Resources, Software & Game",
  siteDescription: "A digital marketplace for graphic design resources, editable design files, software and apps.",
  seoKeywords: "vyrqonix, Vyrqonix, Free Game Download, Free PC Games, Free Design, Free Graphic Design, softwer, pc softwe, PC Software, Free Software Download, admibe illustetor, Adobe Illustrator, Adobe Photoshop, Graphic Templates, Vector, PSD, Mockups, Software Download, Digital Marketplace, Murad Graphics, Bangladesh",
  googleVerification: "",
  allProductsImage: "/categories/all-products.png",
  phone: "01566088159",
  email: "muradrahman2026@gmail.com",
  address: "Dhaka, Bangladesh",
  whatsapp: "01566088159",
  currency: "BDT",
  timezone: "Asia/Dhaka",
  defaultLicensePolicy: "Vyrqonix থেকে ক্রয়কৃত বা ডাউনলোড করা সকল ডিজিটাল আইটেম আপনার ব্যক্তিগত এবং ক্লায়েন্ট প্রজেক্টের কাজের জন্য ব্যবহারযোগ্য। মূল এডিটেবল সোর্স ফাইল বা অ্যাক্সেস সরাসরি পুনরায় বিক্রি, অননুমোদিত শেয়ারিং বা অন্য কোথাও বিতরণ করা সম্পূর্ণ নিষিদ্ধ।",
  defaultRefundPolicy: "ডিজিটাল প্রোডাক্টের তাৎক্ষণিক ডেলিভারি প্রকৃতির কারণে একবার ফাইল বা অ্যাক্সেস সক্রিয় হয়ে গেলে সাধারণত রিফান্ড প্রযোজ্য হয় না। তবে কোনো ফাইলে কোনো ত্রুটি থাকলে বা ব্যবহারে সমস্যা হলে এবং আমাদের সাপোর্ট টিম তা সমাধান করতে ব্যর্থ হলে রিফান্ড বা বিকল্প সমাধান বিবেচনা করা হবে।",
  termsAndConditions: "By using Vyrqonix and downloading digital assets, you agree to comply with our terms of service, copyright guidelines, and acceptable use policy.",
  privacyPolicy: "We respect your privacy. Vyrqonix collects only the minimum information required for account authentication and digital purchase order verification.",
  aboutText: "Vyrqonix is a premier digital assets marketplace dedicated to empowering creators, agencies, freelancers, and businesses with high-quality graphic resources, templates, and software solutions.",
  faqList: [
    { question: "How do I download my purchased items?", answer: "Once your payment is verified or you click claim on a free item, navigate to your Account > Downloads to access your files at any time." },
    { question: "Can I use these designs for client projects?", answer: "Yes! Standard commercial use for client work is included. You may not re-distribute the raw editable files for sale." },
    { question: "What formats are provided?", answer: "Our products support AI, EPS, PSD, SVG, PNG, PDF, ZIP bundles, and software installers as specified on each product's page." },
    { question: "How does payment verification work in Bangladesh?", answer: "We support bKash, Nagad, and Rocket mobile banking. Once you submit your order and transaction ID, the order is verified and download access is instantly granted." }
  ],
  socialLinks: [
    { id: "1", name: "YouTube", url: "https://www.youtube.com/channel/UCDP9PD8OEpJkq63hMVNCYSg", icon: "youtube", isVisible: true, order: 1 },
    { id: "2", name: "Facebook", url: "https://www.facebook.com/vyrqonix", icon: "facebook", isVisible: true, order: 2 },
    { id: "3", name: "WhatsApp", url: "https://wa.me/8801566088159", icon: "whatsapp", isVisible: true, order: 3 }
  ],
  footerBadges: [
    {
      id: "badge-1",
      title: "Instant Digital Delivery",
      subtitle: "Download source files right after order confirmation",
      icon: "download"
    },
    {
      id: "badge-2",
      title: "100% Genuine & Authentic",
      subtitle: "Verified digital access and premium creative assets",
      icon: "shield"
    },
    {
      id: "badge-3",
      title: "100% Editable Files & Working Games",
      subtitle: "Layered design assets, verified software & tested games",
      icon: "sparkles"
    }
  ],
  showFooterBadges: true,
  footerColumns: [
    {
      id: "col-support",
      title: "Support & Info",
      links: [
        { id: "link-1", label: "About Us", url: "/about", isVisible: true },
        { id: "link-2", label: "Contact Support", url: "/contact", isVisible: true },
        { id: "link-3", label: "Refund Policy", url: "/refund-policy", isVisible: true },
        { id: "link-4", label: "Privacy Policy", url: "/privacy-policy", isVisible: true },
        { id: "link-5", label: "Terms of Service", url: "/terms", isVisible: true }
      ]
    }
  ],
  footerContactTitle: "Direct Contact",
  footerCopyrightText: "© {year} {siteName}. All rights reserved.",
  footerDesignerPrefix: "Design by",
  footerDesignerName: "Murad Rahman",
  footerDesignerUrl: "https://www.facebook.com/profile.php?id=100085471628384"
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
export const getSiteSettings = async (forceFresh = false): Promise<SiteSettings> => {
  const bengaliLicense = "Vyrqonix থেকে ক্রয়কৃত বা ডাউনলোড করা সকল ডিজিটাল আইটেম আপনার ব্যক্তিগত এবং ক্লায়েন্ট প্রজেক্টের কাজের জন্য ব্যবহারযোগ্য। মূল এডিটেবল সোর্স ফাইল বা অ্যাক্সেস সরাসরি পুনরায় বিক্রি, অননুমোদিত শেয়ারিং বা অন্য কোথাও বিতরণ করা সম্পূর্ণ নিষিদ্ধ।";
  const bengaliRefund = "ডিজিটাল প্রোডাক্টের তাৎক্ষণিক ডেলিভারি প্রকৃতির কারণে একবার ফাইল বা অ্যাক্সেস সক্রিয় হয়ে গেলে সাধারণত রিফান্ড প্রযোজ্য হয় না। তবে কোনো ফাইলে কোনো ত্রুটি থাকলে বা ব্যবহারে সমস্যা হলে এবং আমাদের সাপোর্ট টিম তা সমাধান করতে ব্যর্থ হলে রিফান্ড বা বিকল্প সমাধান বিবেচনা করা হবে।";

  if (!forceFresh) {
    const cached = fastCacheGet<SiteSettings>('site_settings', 180_000);
    if (cached) {
      if (cached.siteName === 'Murad Graphics' || !cached.siteName) cached.siteName = 'Vyrqonix';
      if (!cached.defaultLicensePolicy || !cached.defaultLicensePolicy.includes('Vyrqonix থেকে')) {
        cached.defaultLicensePolicy = bengaliLicense;
      }
      if (!cached.defaultRefundPolicy || !cached.defaultRefundPolicy.includes('ডিজিটাল প্রোডাক্টের')) {
        cached.defaultRefundPolicy = bengaliRefund;
      }
      return cached;
    }
  }

  if (inFlightPromises.has('site_settings') && !forceFresh) {
    return inFlightPromises.get('site_settings')!;
  }

  const promise = (async () => {
    try {
      const docRef = doc(db, "settings", "general");
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const raw = snapshot.data();
        const data = { ...DEFAULT_SITE_SETTINGS, ...raw } as SiteSettings;
        if (data.siteName === 'Murad Graphics' || !data.siteName) {
          data.siteName = 'Vyrqonix';
        }
        if (!data.defaultLicensePolicy || !data.defaultLicensePolicy.includes('Vyrqonix থেকে')) {
          data.defaultLicensePolicy = bengaliLicense;
        }
        if (!data.defaultRefundPolicy || !data.defaultRefundPolicy.includes('ডিজিটাল প্রোডাক্টের')) {
          data.defaultRefundPolicy = bengaliRefund;
        }
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
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Order))
      .filter((o) => o.status !== 'deleted' && !(o as any).hiddenByUser);
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err) {
    console.error("Error fetching user orders:", err);
    return [];
  }
};

export const getAllOrdersAdmin = async (): Promise<Order[]> => {
  try {
    // 1. Fetch all orders from 'orders' collection
    let ordersList: Order[] = [];
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      ordersList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    } catch (err) {
      console.warn("Fallback query without orderBy for orders:", err);
      try {
        const snap = await getDocs(collection(db, "orders"));
        ordersList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      } catch (e) {
        console.error("Failed to fetch orders collection:", e);
      }
    }

    // 2. Fetch all download entitlements so every free download or claim is included
    let entitlementsList: DownloadEntitlement[] = [];
    try {
      const snap = await getDocs(collection(db, "downloadEntitlements"));
      entitlementsList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DownloadEntitlement));
    } catch (e) {
      console.warn("Could not fetch downloadEntitlements for admin orders:", e);
    }

    // 3. Track existing user + product pairs already present in orders to prevent duplicates
    const existingPairs = new Set<string>();
    ordersList.forEach((order) => {
      const u = order.userId || order.userEmail || '';
      order.items?.forEach((item) => {
        if (item.productId) {
          existingPairs.add(`${u}_${item.productId}`);
        }
      });
    });

    // 4. Merge synthetic orders from entitlements
    const syntheticOrders: Order[] = entitlementsList
      .filter((ent) => {
        const u = ent.userId || ent.userEmail || '';
        return !existingPairs.has(`${u}_${ent.productId}`);
      })
      .map((ent) => {
        const rawDate = ent.accessGrantedAt || (ent as any).createdAt || ent.lastDownloadedAt || new Date().toISOString();
        const shortId = (ent.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'CLAIM';
        const cName = (ent as any).customerName || (ent.userEmail ? ent.userEmail.split('@')[0] : 'Free User');
        return {
          id: `ent_${ent.id}`,
          orderNumber: `FREE-${shortId}`,
          userId: ent.userId || '',
          userEmail: ent.userEmail || 'Customer',
          customerName: cName,
          customerPhone: (ent as any).customerPhone || '',
          items: [{
            productId: ent.productId,
            name: ent.productName || 'Free Digital Asset',
            slug: ent.productSlug || '',
            price: 0,
            thumbnail: ent.thumbnail || '',
            isFree: true,
            formats: [],
            zipPassword: ent.zipPassword || '',
            deliveryMethod: ent.deliveryMethod || 'direct_upload',
            quantity: 1
          }],
          subtotal: 0,
          discount: 0,
          total: 0,
          currency: 'BDT',
          paymentMethod: 'Free Download',
          transactionId: 'FREE-CLAIM',
          paymentStatus: 'verified' as OrderPaymentStatus,
          status: 'completed',
          createdAt: rawDate,
          updatedAt: rawDate
        };
      });

    const combined = [...ordersList, ...syntheticOrders];

    // 5. Sort all by date descending
    combined.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return combined;
  } catch (err) {
    console.error("Error fetching all orders & downloads for admin:", err);
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
  if (orderId.startsWith('ent_')) {
    const rawId = orderId.replace('ent_', '');
    await deleteDoc(doc(db, "downloadEntitlements", rawId)).catch(() => {});
  } else {
    await deleteDoc(doc(db, "orders", orderId)).catch(() => {});
    await deleteDoc(doc(db, "downloadEntitlements", orderId)).catch(() => {});
  }
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
      deliveryMethod: item.deliveryMethod || 'direct_upload',
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

export const grantFreeEntitlement = async (user: { uid: string; email: string; displayName?: string }, product: Product): Promise<void> => {
  try {
    const customerDisplayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Customer');
    const safeEmail = user.email || '';

    // Check if entitlement already exists
    const q = query(
      collection(db, "downloadEntitlements"),
      where("userId", "==", user.uid),
      where("productId", "==", product.id),
      limit(5)
    );
    const snap = await getDocs(q);

    const activeDoc = snap.docs.find(d => !d.data().status || d.data().status === 'active');

    if (!activeDoc) {
      if (!snap.empty) {
        // Reactivate previously deleted/hidden document
        await updateDoc(snap.docs[0].ref, cleanUndefined({
          status: 'active',
          productName: product.name || '',
          productSlug: product.slug || '',
          thumbnail: product.thumbnail || '',
          zipPassword: product.zipPassword || '',
          deliveryMethod: product.deliveryMethod || 'direct_upload',
          accessGrantedAt: new Date().toISOString()
        }));
      } else {
        await addDoc(collection(db, "downloadEntitlements"), cleanUndefined({
          userId: user.uid,
          userEmail: safeEmail,
          customerName: customerDisplayName,
          productId: product.id,
          productName: product.name || '',
          productSlug: product.slug || '',
          thumbnail: product.thumbnail || '',
          isFree: true,
          zipPassword: product.zipPassword || '',
          deliveryMethod: product.deliveryMethod || 'direct_upload',
          accessGrantedAt: new Date().toISOString(),
          downloadCount: 0,
          status: 'active'
        }));
      }
    }

    // Also record a verified free order record so it appears under My Orders & Purchases
    try {
      const existingOrderQ = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        limit(20)
      );
      const orderSnap = await getDocs(existingOrderQ);
      const hasOrder = orderSnap.docs.some(d => {
        const data = d.data();
        return data.items?.some((i: any) => i.productId === product.id);
      });

      if (!hasOrder) {
        const orderNumber = `FREE-${Date.now().toString().slice(-6)}`;
        await addDoc(collection(db, "orders"), cleanUndefined({
          userId: user.uid,
          userEmail: safeEmail,
          customerName: customerDisplayName,
          orderNumber: orderNumber,
          items: [{
            productId: product.id,
            name: product.name,
            slug: product.slug || '',
            price: 0,
            quantity: 1,
            thumbnail: product.thumbnail || '',
            isFree: true,
            formats: product.formats || [],
            zipPassword: product.zipPassword || '',
            deliveryMethod: product.deliveryMethod || 'direct_upload',
          }],
          subtotal: 0,
          discount: 0,
          total: 0,
          currency: 'BDT',
          paymentMethod: 'free_checkout',
          transactionId: 'FREE-CLAIM',
          paymentStatus: 'verified',
          status: 'completed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }
    } catch (orderErr) {
      console.warn("Could not save free order doc:", orderErr);
    }

    // Increment download/claim count safely
    try {
      const productRef = doc(db, "products", product.id);
      await updateDoc(productRef, {
        downloadCount: increment(1)
      });
    } catch {
      // Regular customer may not have write permission on product catalog document
    }
  } catch (err) {
    console.error("Failed to grant free entitlement:", err);
    throw err;
  }
};

export const getUserEntitlements = async (userId: string, userEmail?: string): Promise<DownloadEntitlement[]> => {
  try {
    const listMap = new Map<string, DownloadEntitlement>();

    // 1. Query by userId
    try {
      const q = query(
        collection(db, "downloadEntitlements"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const item = { id: d.id, ...d.data() } as DownloadEntitlement;
        if (!item.status || item.status === 'active') {
          listMap.set(item.productId || item.id, item);
        }
      });
    } catch (e) {
      console.warn("Error querying entitlements by userId:", e);
    }

    // 2. Query by userEmail as secondary fallback if available
    if (userEmail && userEmail.includes('@')) {
      try {
        const qEmail = query(
          collection(db, "downloadEntitlements"),
          where("userEmail", "==", userEmail)
        );
        const emailSnap = await getDocs(qEmail);
        emailSnap.docs.forEach((d) => {
          const item = { id: d.id, ...d.data() } as DownloadEntitlement;
          if (!item.status || item.status === 'active') {
            if (!listMap.has(item.productId || item.id)) {
              listMap.set(item.productId || item.id, item);
            }
          }
        });
      } catch {
        // Fallback
      }
    }

    const list = Array.from(listMap.values());
    return list.sort((a, b) => new Date(b.accessGrantedAt || 0).getTime() - new Date(a.accessGrantedAt || 0).getTime());
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
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      return !data.status || data.status === 'active';
    }
    return false;
  } catch {
    return false;
  }
};

export const deleteUserEntitlement = async (entitlementId: string, userId: string, productId?: string): Promise<void> => {
  try {
    // 1. If entitlementId starts with order_, extract order id and mark it deleted/hidden
    if (entitlementId && entitlementId.startsWith('order_')) {
      const parts = entitlementId.split('_');
      // format: order_{orderId}_{productId}
      const orderId = parts[1];
      if (orderId) {
        const orderRef = doc(db, "orders", orderId);
        await deleteDoc(orderRef).catch(async () => {
          await updateDoc(orderRef, { status: 'deleted', hiddenByUser: true });
        });
      }
    } else if (entitlementId) {
      const entRef = doc(db, "downloadEntitlements", entitlementId);
      await deleteDoc(entRef).catch(async () => {
        await updateDoc(entRef, { status: 'deleted' });
      });
    }

    // 2. Also find and delete any matching entitlements in downloadEntitlements
    if (productId && userId) {
      try {
        const q = query(
          collection(db, "downloadEntitlements"),
          where("userId", "==", userId),
          where("productId", "==", productId)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(d.ref).catch(() => updateDoc(d.ref, { status: 'deleted' }));
        }
      } catch (e) {
        console.warn("Could not batch delete entitlement docs:", e);
      }

      // Also soft-delete / hide any order in 'orders' containing this productId
      try {
        const orderQ = query(
          collection(db, "orders"),
          where("userId", "==", userId),
          limit(20)
        );
        const oSnap = await getDocs(orderQ);
        for (const d of oSnap.docs) {
          const data = d.data();
          if (data.items?.some((i: any) => i.productId === productId)) {
            await deleteDoc(d.ref).catch(() => updateDoc(d.ref, { status: 'deleted', hiddenByUser: true }));
          }
        }
      } catch (oe) {
        console.warn("Could not batch delete order docs for product:", oe);
      }
    }
  } catch (err) {
    console.error("Error deleting entitlement:", err);
    throw err;
  }
};

export const deleteUserOrder = async (orderId: string, userId: string, productIds?: string[]): Promise<void> => {
  try {
    // 1. If it's a synthetic entitlement order
    if (orderId.startsWith('ent_')) {
      const realEntId = orderId.replace('ent_', '');
      await deleteUserEntitlement(realEntId, userId, productIds?.[0]);
      return;
    }

    // 2. Real order in 'orders' collection
    const orderRef = doc(db, "orders", orderId);
    await deleteDoc(orderRef).catch(async () => {
      await updateDoc(orderRef, {
        status: 'deleted',
        hiddenByUser: true,
        updatedAt: new Date().toISOString()
      });
    });

    // 3. Also delete corresponding download entitlements for the items in this order
    if (productIds && productIds.length > 0) {
      for (const pId of productIds) {
        await deleteUserEntitlement('', userId, pId).catch(() => {});
      }
    }
  } catch (err) {
    console.error("Error deleting order:", err);
    throw err;
  }
};

export const recordDownloadEvent = async (entitlementId: string, productId: string, userId: string): Promise<void> => {
  try {
    if (entitlementId && entitlementId !== 'direct_entitlement') {
      try {
        const entRef = doc(db, "downloadEntitlements", entitlementId);
        await updateDoc(entRef, {
          downloadCount: increment(1),
          lastDownloadedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Could not update entitlement counter:", err);
      }
    }

    try {
      const prodRef = doc(db, "products", productId);
      await updateDoc(prodRef, {
        downloadCount: increment(1)
      });
    } catch {
      // Non-admin may not have write permission on products catalog
    }

    // Also record in downloadEvents for audit
    try {
      await addDoc(collection(db, "downloadEvents"), {
        entitlementId: entitlementId || 'direct',
        productId,
        userId,
        downloadedAt: new Date().toISOString()
      });
    } catch {}
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
    displayName: "Vyrqonix Super Admin",
    role: "owner",
    addedAt: "2026-01-01T00:00:00.000Z",
    status: "active"
  });

  try {
    const snap = await getDocs(collection(db, "admins"));
    for (const d of snap.docs) {
      const data = d.data() as Partial<AdminMember>;
      // Skip if it duplicates the root Super Admin
      if (d.id !== SUPER_ADMIN_UID && data.email?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        const emailLower = (data.email || '').toLowerCase();
        let role: AdminRole = 'manager';

        // Respect the role stored in Firestore
        if (data.role === 'owner' || data.role === 'super_admin') {
          role = 'owner';
        } else if (data.role === 'viewer') {
          role = 'viewer';
        } else if (data.role === 'manager') {
          role = 'manager';
        } else {
          role = 'manager';
        }

        admins.push({
          id: d.id,
          uid: data.uid || d.id,
          email: data.email || '',
          displayName: data.displayName || data.email?.split('@')[0] || 'Administrator',
          role,
          addedBy: data.addedBy || '',
          addedByEmail: data.addedByEmail || '',
          addedAt: data.addedAt || new Date().toISOString(),
          status: 'active'
        });
      }
    }

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
  role: 'owner' | 'manager' | 'viewer',
  caller: { uid: string; email: string | null }
): Promise<AdminMember> => {
  const cleanEmail = emailToPromote.trim().toLowerCase();

  // Validate caller authorization: MUST be Super Admin or Owner
  let isCallerAuthorized = 
    caller.uid === SUPER_ADMIN_UID || 
    caller.uid === ADMIN_UID || 
    caller.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
    caller.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    caller.email?.toLowerCase() === 'muradrahman2026@gmail.com';

  if (!isCallerAuthorized && caller.uid) {
    try {
      const callerSnap = await getDoc(doc(db, "admins", caller.uid));
      if (callerSnap.exists() && callerSnap.data().status === 'active') {
        const callerRole = (callerSnap.data().role || '').toLowerCase();
        if (callerRole === 'owner' || callerRole === 'super_admin') {
          isCallerAuthorized = true;
        }
      }
    } catch {}
  }

  if (!isCallerAuthorized) {
    throw new Error("অননুমোদিত: শুধুমাত্র ওনার (Owner) নতুন এডমিন নিয়োগ করতে পারবেন।");
  }

  // Prevent promoting Super Admin or self
  if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error("এই অ্যাকাউন্টটি ইতোমধ্যে প্রধান সুপার এডমিন।");
  }

  // Search existing registered account in Firestore `users` collection
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", cleanEmail), limit(1));
  const userQuerySnap = await getDocs(q);

  if (userQuerySnap.empty) {
    throw new Error("এই ইমেইলটি দিয়ে এখনও ওয়েবসাইটে সাইন-ইন করা হয়নি। যাকে এডমিন বানাতে চান তাকে আগে Vyrqonix ওয়েবসাইটে অন্তত একবার লগইন বা সাইন-আপ করতে হবে।");
  }

  const userDoc = userQuerySnap.docs[0];
  const userData = userDoc.data();
  const targetUid = userDoc.id;

  // Check if target user is already in `admins` collection
  const adminDocSnap = await getDoc(doc(db, "admins", targetUid));
  if (adminDocSnap.exists() && adminDocSnap.data().status === 'active') {
    throw new Error("এই ইউজার ইতোমধ্যে একজন এডমিন হিসেবে যুক্ত আছেন। তার পদবি পরিবর্তন করতে নিচের এডমিন লিস্ট থেকে রোল পরিবর্তন করুন।");
  }

  const newAdminData: AdminMember = {
    id: targetUid,
    uid: targetUid,
    email: cleanEmail,
    displayName: userData.displayName || cleanEmail.split('@')[0],
    role: role || 'manager',
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
    details: { promotedEmail: cleanEmail, promotedName: newAdminData.displayName, role }
  });

  return newAdminData;
};

export const updateAdminRole = async (
  targetAdminUid: string,
  newRole: 'owner' | 'manager' | 'viewer',
  caller: { uid: string; email: string | null }
): Promise<void> => {
  // Validate caller authorization: MUST be Super Admin or Owner
  let isCallerAuthorized = 
    caller.uid === SUPER_ADMIN_UID || 
    caller.uid === ADMIN_UID || 
    caller.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
    caller.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!isCallerAuthorized && caller.uid) {
    try {
      const callerSnap = await getDoc(doc(db, "admins", caller.uid));
      if (callerSnap.exists() && callerSnap.data().status === 'active') {
        const callerRole = (callerSnap.data().role || '').toLowerCase();
        if (callerRole === 'owner' || callerRole === 'super_admin') {
          isCallerAuthorized = true;
        }
      }
    } catch {}
  }

  if (!isCallerAuthorized) {
    throw new Error("অননুমোদিত: শুধুমাত্র ওনার (Owner) পদবি পরিবর্তন করতে পারবেন।");
  }

  if (targetAdminUid === SUPER_ADMIN_UID) {
    throw new Error("প্রধান রুট সুপার এডমিনের পদবি পরিবর্তন করা সম্ভব নয়।");
  }

  // Update in Firestore: handle both direct doc ID and query by uid or email
  let updated = false;
  try {
    const directDocRef = doc(db, "admins", targetAdminUid);
    const directSnap = await getDoc(directDocRef);
    if (directSnap.exists()) {
      await updateDoc(directDocRef, { role: newRole });
      updated = true;
    }
  } catch (e) {
    console.warn("Direct doc update failed:", e);
  }

  if (!updated) {
    try {
      const q = query(collection(db, "admins"), where("uid", "==", targetAdminUid), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        await updateDoc(qSnap.docs[0].ref, { role: newRole });
        updated = true;
      }
    } catch (e) {
      console.warn("Query by uid failed:", e);
    }
  }

  if (!updated) {
    await setDoc(doc(db, "admins", targetAdminUid), { role: newRole }, { merge: true });
  }

  // Refresh admin list to update whitelist
  getAdminList().catch(() => {});

  // Record immutable audit log
  await recordAuditLog({
    adminUid: caller.uid,
    adminEmail: caller.email || '',
    action: 'UPDATE_ADMIN_ROLE',
    targetType: 'ADMIN_ROLE',
    targetId: targetAdminUid,
    details: { newRole }
  });
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
