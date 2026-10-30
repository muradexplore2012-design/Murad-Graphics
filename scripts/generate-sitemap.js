import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');

const config = {
  apiKey: "AIzaSyBcEGAIsdY3l9V3jR_yclhzkvE7gQy-jEU",
  projectId: "muradgraphics-f6d59"
};

const SITE_URL = 'https://vyrqonix.netlify.app';
const TODAY = new Date().toISOString().split('T')[0];

async function generateSitemap() {
  const staticRoutes = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/shop`, priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE_URL}/about`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${SITE_URL}/contact`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${SITE_URL}/faq`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${SITE_URL}/license-policy`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/refund-policy`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/terms`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/privacy`, priority: '0.5', changefreq: 'monthly' }
  ];

  let dynamicRoutes = [];

  try {
    const app = initializeApp(config);
    const db = getFirestore(app);

    // Fetch active categories
    try {
      const catSnap = await getDocs(collection(db, 'categories'));
      catSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isActive !== false) {
          const slug = data.slug || docSnap.id;
          dynamicRoutes.push({
            loc: `${SITE_URL}/category/${slug}`,
            priority: '0.8',
            changefreq: 'weekly',
            lastmod: TODAY
          });
        }
      });
      console.log(`[Sitemap] Added ${dynamicRoutes.length} categories to sitemap.`);
    } catch (e) {
      console.warn('[Sitemap] Could not fetch categories for sitemap:', e.message);
    }

    // Fetch active products
    try {
      const prodQuery = query(collection(db, 'products'), where('isActive', '==', true));
      const prodSnap = await getDocs(prodQuery);
      let prodCount = 0;
      prodSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const slug = data.slug || docSnap.id;
        let lastmod = TODAY;
        if (data.updatedAt) {
          try {
            lastmod = new Date(data.updatedAt).toISOString().split('T')[0];
          } catch {}
        }
        dynamicRoutes.push({
          loc: `${SITE_URL}/product/${slug}`,
          priority: '0.8',
          changefreq: 'weekly',
          lastmod
        });
        prodCount++;
      });
      console.log(`[Sitemap] Added ${prodCount} products to sitemap.`);
    } catch (e) {
      console.warn('[Sitemap] Could not fetch products for sitemap:', e.message);
    }

  } catch (err) {
    console.warn('[Sitemap] Firebase initialization error, generating basic sitemap:', err.message);
  }

  const allUrls = [...staticRoutes, ...dynamicRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map((item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod || TODAY}</lastmod>
    <changefreq>${item.changefreq || 'weekly'}</changefreq>
    <priority>${item.priority || '0.7'}</priority>
  </url>`).join('\n')}
</urlset>
`;

  try {
    fs.writeFileSync(sitemapPath, xml.trim(), 'utf8');
    console.log(`[Sitemap] Successfully generated sitemap.xml with ${allUrls.length} URLs at: ${sitemapPath}`);
  } catch (err) {
    console.error('[Sitemap] Failed to write sitemap.xml:', err);
  }
}

generateSitemap().then(() => process.exit(0)).catch(() => process.exit(0));
