# Murad Graphics - Digital Product Marketplace

A modern, production-ready Bangladeshi digital marketplace for graphic design resources, editable templates, vector arts, mockups, fonts, software, and tools.

---

## 🚀 Features & Architecture

### 1. Customer Experience
- **100% Mobile + PC Responsive**: Tested across viewports from small mobile screens (320px) to desktop (1920px).
- **Official Brand Design**: Built with the official **Murad Graphics** logo, brand palette (`#2563EB` and `#1E3A8A`), and design inspiration from modern digital marketplaces.
- **Product Presentation**: Multi-image preview galleries, format tags (`AI`, `EPS`, `PSD`, `SVG`, `PNG`, `PDF`, `ZIP`, `APK`, `EXE`), compatibility specs, and bundle contents.
- **Free & Paid Support**: Clean 1-click claim flow for free items, and structured Bangladeshi checkout (`bKash`, `Nagad`, `Rocket`) with TrxID logging.
- **Download Entitlements**: Files are protected until purchase verification; claimed files unlock in `/account/downloads`.
- **Search & Filter**: Real-time filtering by category, format, and free vs paid without excessive reads.
- **Cart & Wishlist**: Digital duplicate-prevention cart and local + account synced wishlist.
- **Reviews**: Verified-purchase rating and moderation system.

### 2. Administrator Management (`/admin`)
- **Strict Role-Based Security**: Only users matching the designated Admin UID (`AFpFL3xlZTeWPtf89mkeRHVU0sj1`) or email can access the dashboard.
- **Zero Fake Data**: The marketplace launches with clean empty states until the administrator adds real content.
- **Product Management**: Full CRUD for products, image uploading, format selection, price configuration in BDT (৳), and delivery choices.
- **Dual Delivery Methods**:
  1. **Direct File Upload**: Uploads source bundles directly to Firebase Storage without requiring third-party links.
  2. **Google Drive Link**: Allows pasting external Drive share links for large archives.
- **Category Management**: Create, edit, and organize product categories with slug generation and ordering.
- **Order Verification**: Review submitted customer orders, verify transaction IDs, and activate download entitlements.
- **Promotional Coupons**: Percentage or fixed BDT discounts with expiry dates and minimum order subtotals.
- **Homepage & Footer Customizer**: Add or edit homepage banners, update contact numbers, and add/remove social media links.
- **Audit Logs**: Immutable log recording administrative actions.

---

## 🛠 Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, CSS Design Tokens
- **Icons**: Lucide React
- **Backend & Auth**: Firebase Authentication, Cloud Firestore, Firebase Storage
- **Routing**: React Router DOM (v7)

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY="AIzaSyBcEGAIsdY3l9V3jR_yclhzkvE7gQy-jEU"
VITE_FIREBASE_AUTH_DOMAIN="muradgraphics-f6d59.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="muradgraphics-f6d59"
VITE_FIREBASE_STORAGE_BUCKET="muradgraphics-f6d59.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="333295319911"
VITE_FIREBASE_APP_ID="1:333295319911:web:18341a803848ce2ec80dc2"
VITE_FIREBASE_MEASUREMENT_ID="1:333295319911:web:18341a803848ce2ec80dc2"
VITE_ADMIN_UID="AFpFL3xlZTeWPtf89mkeRHVU0sj1"
VITE_ADMIN_EMAIL="muradexplore2012@gmail.com"
```

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Production Build
```bash
npm run build
```

---

## 🔒 Firebase Console Setup

1. **Authentication**: Enable **Email/Password** sign-in provider in your Firebase Console.
2. **Firestore Database**: Create Firestore database in production mode. Deploy rules from `firestore.rules`.
3. **Firebase Storage**: Deploy storage rules from `storage.rules`.
4. **Deploy Rules using Firebase CLI** (optional):
   ```bash
   firebase deploy --only firestore:rules,storage
   ```
