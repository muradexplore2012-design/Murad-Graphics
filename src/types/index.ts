export type ProductType = 
  | 'graphic_resource' 
  | 'template' 
  | 'theme'
  | 'font' 
  | 'mockup' 
  | 'software' 
  | 'game' 
  | 'app' 
  | 'bundle' 
  | 'subscription' 
  | 'other';

export type DeliveryMethod = 'direct_upload' | 'google_drive' | 'subscription_access';

export interface ProductFileMetadata {
  name: string;
  size: number; // bytes
  mimeType: string;
  format: string; // AI, PSD, EPS, ZIP, etc.
  storagePath?: string; // Private path in Firebase Storage
  downloadUrl?: string; // Protected URL or external link
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  productType: ProductType;
  
  // Pricing
  isFree: boolean;
  price: number; // in BDT (৳)
  comparePrice?: number; // discount comparison
  showDiscountBadge?: boolean; // toggle whether to show discount % OFF badge
  
  // Media & Previews
  thumbnail: string;
  previews: string[];
  
  // File delivery
  deliveryMethod: DeliveryMethod;
  fileMetadata?: ProductFileMetadata;
  googleDriveUrl?: string; // only if deliveryMethod is google_drive
  zipPassword?: string; // Optional password to extract/unzip the file (e.g. 4-digit code)
  customButtonText?: string; // e.g. 'Download Free Game', 'Download Software'
  subscriptionDuration?: string; // e.g. "1 Month", "6 Months", "1 Year", "Lifetime"
  subscriptionInstructions?: string; // Delivery note or credentials instructions for customer
  
  // Technical specs
  formats: string[]; // ['AI', 'EPS', 'PSD', 'PNG']
  fileSizeText?: string; // e.g. "45.2 MB"
  version?: string; // e.g. "v1.2"
  compatibility?: string; // e.g. "Photoshop CC 2020+, Illustrator"
  bundleContents?: string; // what's included in ZIP
  licenseTerms?: string; // personal / commercial terms
  
  // Metadata & Status
  tags: string[];
  isFeatured: boolean;
  isNewArrival?: boolean;
  isActive: boolean;
  
  // Real stats
  downloadCount: number;
  purchaseCount: number;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  thumbnail: string;
  price: number;
  isFree: boolean;
  formats: string[];
  deliveryMethod: DeliveryMethod;
  zipPassword?: string;
}

export type OrderPaymentStatus = 'pending' | 'verified' | 'failed' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: 'BDT';
  paymentStatus: OrderPaymentStatus;
  paymentMethod?: 'bKash' | 'Nagad' | 'Rocket' | 'bank_transfer' | 'manual' | 'free_checkout';
  transactionId?: string;
  paymentNote?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadEntitlement {
  id: string;
  userId: string;
  userEmail: string;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  orderId?: string;
  isFree: boolean;
  zipPassword?: string;
  deliveryMethod?: DeliveryMethod;
  accessGrantedAt: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  status: 'active' | 'revoked';
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSubtotal?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startDate?: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1 to 5
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl: string;
  imageAlt?: string;
  isActive: boolean;
  order: number;
  placement?: 'slider' | 'side_top' | 'side_bottom_left' | 'side_bottom_right' | 'poster';
  createdAt: string;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  isVisible: boolean;
  order: number;
}

export interface SiteSettings {
  siteName: string;
  siteSubtitle?: string;
  siteTitle?: string;
  siteDescription: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  currency: string;
  timezone: string;
  defaultLicensePolicy: string;
  defaultRefundPolicy: string;
  termsAndConditions: string;
  privacyPolicy: string;
  aboutText: string;
  faqList: Array<{ question: string; answer: string }>;
  socialLinks: SocialLink[];
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface AdminMember {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  role: 'super_admin' | 'admin';
  addedBy?: string;
  addedByEmail?: string;
  addedAt: string;
  status: 'active';
}

declare global {
  interface Window {
    google?: any;
  }
}

