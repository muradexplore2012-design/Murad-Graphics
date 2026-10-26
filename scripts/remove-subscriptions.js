import fs from 'fs';
import path from 'path';

// ==========================================
// 1. CLEAN src/pages/admin/AdminProductFormPage.tsx
// ==========================================
const formPath = 'src/pages/admin/AdminProductFormPage.tsx';
let formContent = fs.readFileSync(formPath, 'utf8').replace(/\r\n/g, '\n');

// Update DEFAULT_FORMATS
formContent = formContent.replace(
  /const DEFAULT_FORMATS = \[\s*'Subscription'[\s\S]*?'Lifetime',\s*/,
  'const DEFAULT_FORMATS = [\n  '
);

// Remove subscription state variables
formContent = formContent.replace(/\s*const \[subscriptionDuration, setSubscriptionDuration\] = useState\('1 Year'\);/, '');
formContent = formContent.replace(/\s*const \[subscriptionInstructions, setSubscriptionInstructions\] = useState\(''\);/, '');
formContent = formContent.replace(/\s*const \[subscriptionInviteUrl, setSubscriptionInviteUrl\] = useState\(''\);/, '');

// Clean getProductById
formContent = formContent.replace(
  /setDeliveryMethod\(prod\.deliveryMethod === 'subscription_access' \? 'subscription_access' : 'google_drive'\);/,
  "setDeliveryMethod(prod.deliveryMethod === 'direct_upload' ? 'direct_upload' : 'google_drive');"
);
formContent = formContent.replace(/\s*setSubscriptionDuration\(prod\.subscriptionDuration \|\| '1 Year'\);/, '');
formContent = formContent.replace(/\s*setSubscriptionInstructions\(prod\.subscriptionInstructions \|\| ''\);/, '');
formContent = formContent.replace(/\s*if \(prod\.deliveryMethod === 'subscription_access' && prod\.googleDriveUrl\) \{\s*setSubscriptionInviteUrl\(prod\.googleDriveUrl\);\s*\}/, '');

// Clean productPayload
formContent = formContent.replace(
  /googleDriveUrl: deliveryMethod === 'google_drive'[\s\S]*?subscriptionInstructions: subscriptionInstructions\.trim\(\) \|\| '.*?',/,
  "googleDriveUrl: googleDriveUrl.trim(),"
);

// Clean Asset Type select
formContent = formContent.replace(
  /<select\s+value=\{productType\}\s+onChange=\{\(e\) => \{[\s\S]*?setProductType\(val\);[\s\S]*?\}\s*\}\s+className="(.*?)"\s*>\s*<option value="subscription">.*?<\/option>/,
  '<select\n                value={productType}\n                onChange={(e) => setProductType(e.target.value as ProductType)}\n                className="$1"\n              >'
);

// Replace Digital Delivery Method section (removing subscription button & config)
const deliveryOldSectionRegex = /<h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">\s*3\. Digital Delivery Method & Access\s*<\/h2>[\s\S]*?{\/\* ZIP \/ Extraction Password/;
const deliveryNewSection = `<h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>3. Digital Delivery Method & Download Link</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
              Google Drive Delivery
            </span>
          </h2>

          <div className="p-4 sm:p-5 rounded-2xl bg-cyan-50/70 border border-cyan-200/90 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-cyan-900">
              <ExternalLink className="w-4 h-4 text-cyan-600" />
              <span>Google Drive Shareable Link *</span>
            </div>
            <input
              type="url"
              required
              placeholder="https://drive.google.com/file/d/..."
              value={googleDriveUrl}
              onChange={(e) => setGoogleDriveUrl(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Google Drive-এ ফাইল আপলোড করে "Anyone with the link can view" পারমিশন দিয়ে শেয়ার লিংকটি এখানে দিন। কাস্টমার অর্ডার কনফার্ম হলে এই সুরক্ষিত লিংক থেকে ফাইল ডাউনলোড করতে পারবেন।
            </p>
          </div>

          {/* ZIP / Extraction Password`;

formContent = formContent.replace(deliveryOldSectionRegex, deliveryNewSection);

// Clean up ZIP password wrapper check
formContent = formContent.replace(/{deliveryMethod !== 'subscription_access' && \(\s*<div className="p-4 rounded-2xl bg-purple-50\/60 border border-purple-200\/80 space-y-2">/, '<div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">');
formContent = formContent.replace(/<\/p>\s*<\/div>\s*\)\s*\}\s*<\/div>\s*{\/\* 4\. Preview Images/, '</p>\n          </div>\n        </div>\n\n        {/* 4. Preview Images');

fs.writeFileSync(formPath, formContent, 'utf8');
console.log('Cleaned AdminProductFormPage.tsx');

// ==========================================
// 2. CLEAN src/pages/admin/AdminProductsPage.tsx
// ==========================================
const prodPagePath = 'src/pages/admin/AdminProductsPage.tsx';
let prodPageContent = fs.readFileSync(prodPagePath, 'utf8').replace(/\r\n/g, '\n');

// Clean mobile card delivery method badge
prodPageContent = prodPageContent.replace(
  /\{prod\.deliveryMethod === 'subscription_access' \? \([\s\S]*?\) : prod\.deliveryMethod === 'google_drive' \? \(/,
  "{prod.deliveryMethod === 'google_drive' ? ("
);

// Clean desktop table delivery method column
prodPageContent = prodPageContent.replace(
  /\{prod\.deliveryMethod === 'subscription_access' \? \([\s\S]*?\) : prod\.deliveryMethod === 'google_drive' \? \(/,
  "{prod.deliveryMethod === 'google_drive' ? ("
);

fs.writeFileSync(prodPagePath, prodPageContent, 'utf8');
console.log('Cleaned AdminProductsPage.tsx');

// ==========================================
// 3. CLEAN src/pages/customer/DownloadsPage.tsx
// ==========================================
const dlPath = 'src/pages/customer/DownloadsPage.tsx';
let dlContent = fs.readFileSync(dlPath, 'utf8').replace(/\r\n/g, '\n');

// Remove activeSubscriptionModal state and handlers
dlContent = dlContent.replace(/\s*const \[activeTab, setActiveTab\] = useState<'all' \| 'files' \| 'subscriptions'>\('all'\);/, '');
dlContent = dlContent.replace(/\s*\/\/ Modal for subscription activation details[\s\S]*?const \[activeSubscriptionModal, setActiveSubscriptionModal\] = useState<\{[\s\S]*?\} \| null>\(null\);/, '');
dlContent = dlContent.replace(/\s*const isSubscriptionItem = \(ent: DownloadEntitlement\): boolean => \{[\s\S]*?\};\s*const handleOpenSubscription = async \(entitlement: DownloadEntitlement\) => \{[\s\S]*?\};/, '');

// In handleDownloadFile: remove subscription redirect
dlContent = dlContent.replace(/\s*\/\/ If it is a subscription, redirect to subscription modal[\s\S]*?handleOpenSubscription\(entitlement\);\s*return;\s*\}/, '');

// Clean filter counts and tabs in DownloadsPage
dlContent = dlContent.replace(/const subscriptionsCount = entitlements\.filter\(isSubscriptionItem\)\.length;\s*const filesCount = entitlements\.length - subscriptionsCount;\s*const filteredEntitlements = entitlements\.filter\(\(ent\) => \{[\s\S]*?\}\);/, 'const filteredEntitlements = entitlements;');

// Clean Subscriptions tab button
dlContent = dlContent.replace(/\{entitlements\.length > 0 && \([\s\S]*?All Items \(\{entitlements\.length\}\)[\s\S]*?<\/div>\s*\)\}/, '');

// Clean header subtitle
dlContent = dlContent.replace(/Access and re-download your purchased assets, files, and subscription access/, 'Access and re-download your purchased assets and design files');

// Clean EmptyState descriptions
dlContent = dlContent.replace(/title=\{activeTab === 'subscriptions' \? "No subscriptions found" : "No digital items found"\}/, 'title="No digital items found"');
dlContent = dlContent.replace(/description=\{activeTab === 'subscriptions' \? "You don't have any active subscriptions yet\." : "You haven't claimed any freebies or completed any purchases yet\."\}/, 'description="You haven\'t claimed any freebies or completed any purchases yet."');
dlContent = dlContent.replace(/templates, and subscription access in one place\./, 'templates, and creative files in one place.');

// Clean card rendering (remove isSub and subscription badge / active subscription button)
dlContent = dlContent.replace(/const isSub = isSubscriptionItem\(ent\);/, '');
dlContent = dlContent.replace(/\{isSub \? \([\s\S]*?Subscription Access[\s\S]*?\) : \(/, '(');
dlContent = dlContent.replace(/\)\s*\}\s*<\/div>\s*<h3 className="font-bold text-sm text-slate-900/, '</div>\n                  <h3 className="font-bold text-sm text-slate-900');
dlContent = dlContent.replace(/\{isSub \? \([\s\S]*?Active Subscription[\s\S]*?\) : \(/, '(');
dlContent = dlContent.replace(/\)\s*\}\s*<\/div>\s*<\/div>\s*\);\s*\}\)\s*\}\s*<\/div>\s*\}\)\s*;\s*\}\)\s*<\/div>/, '</div>\n              </div>\n            );\n          })}\n        </div>');

// Remove activeSubscriptionModal JSX block completely
dlContent = dlContent.replace(/{\/\* ================= 1\. SUBSCRIPTION ACCESS MODAL[\s\S]*?{\/\* ================= 2\. FILE DOWNLOAD \/ ZIP PASSWORD POPUP MODAL/, '{/* ================= FILE DOWNLOAD / ZIP PASSWORD POPUP MODAL');

fs.writeFileSync(dlPath, dlContent, 'utf8');
console.log('Cleaned DownloadsPage.tsx');

// ==========================================
// 4. CLEAN src/pages/customer/ProductDetailPage.tsx
// ==========================================
const pdpPath = 'src/pages/customer/ProductDetailPage.tsx';
let pdpContent = fs.readFileSync(pdpPath, 'utf8').replace(/\r\n/g, '\n');

// Remove selectedPlan state
pdpContent = pdpContent.replace(/\s*const \[selectedPlan, setSelectedPlan\] = useState\('1 Year'\);/, '');

// Remove Plan Selector UI
pdpContent = pdpContent.replace(/{\/\* Plan Selector \(Matching Screenshot: 1 Month, 6 Months, 1 Year\) \*\/}[\s\S]*?<\/div>\s*<\/div>\s*{\/\* Quantity Stepper/, '{/* Quantity Stepper');

// Remove subscription_access check in hasEntitlement block
pdpContent = pdpContent.replace(/\{product\.deliveryMethod === 'subscription_access' \? \([\s\S]*?\) : \(/, '(');
pdpContent = pdpContent.replace(/\)\s*\}\s*<\/div>\s*\) : product\.isFree \? \(/, '</div>\n            ) : product.isFree ? (');

// Remove subscription alert from handleFreeDownload
pdpContent = pdpContent.replace(/if \(product\.deliveryMethod === 'subscription_access'\) \{[\s\S]*?\}\s*\}, 800\);\s*\}/, '');

// Clean Delivery Method row in Additional Info table
pdpContent = pdpContent.replace(/\{product\.deliveryMethod === 'subscription_access'[\s\S]*?: product\.deliveryMethod === 'google_drive'/, "{product.deliveryMethod === 'google_drive'");

fs.writeFileSync(pdpPath, pdpContent, 'utf8');
console.log('Cleaned ProductDetailPage.tsx');
