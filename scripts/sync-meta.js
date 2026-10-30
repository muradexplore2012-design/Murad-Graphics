import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../index.html');
const manifestPath = path.resolve(__dirname, '../public/manifest.json');

const config = {
  apiKey: "AIzaSyBcEGAIsdY3l9V3jR_yclhzkvE7gQy-jEU",
  projectId: "muradgraphics-f6d59"
};

async function syncMeta() {
  try {
    const app = initializeApp(config);
    const db = getFirestore(app);
    const snap = await getDoc(doc(db, 'settings', 'general'));
    
    if (!snap.exists()) {
      console.log('No settings doc found, keeping index.html defaults');
      process.exit(0);
    }

    const data = snap.data();
    const siteName = (data.siteName || 'Vyrqonix').trim();
    const siteSubtitle = (data.siteSubtitle || 'YOUR DIGITAL WORLD').trim();
    const siteTitle = data.siteTitle || `${siteName} | ${siteSubtitle}`;
    const siteDescription = data.siteDescription || 'A digital marketplace for graphic design resources, editable design files, software and apps.';
    const defaultKeywords = 'vyrqonix, Vyrqonix, Free Game Download, Free PC Games, Free Design, Free Graphic Design, softwer, pc softwe, PC Software, Free Software Download, admibe illustetor, Adobe Illustrator, Adobe Photoshop, Graphic Templates, Vector, PSD, Mockups, Software Download, Digital Marketplace, Murad Graphics, Bangladesh';
    const seoKeywords = (data.seoKeywords || defaultKeywords).trim();
    const googleVerification = (data.googleVerification || '').trim();
    const appFullName = `${siteName} - ${siteSubtitle}`;

    // 1. Sync public/manifest.json
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.name = appFullName;
        manifest.short_name = siteName;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        console.log(`Successfully synced manifest.json with name: "${appFullName}"`);
      } catch (err) {
        console.warn('Could not sync manifest.json:', err.message);
      }
    }

    // 2. Sync index.html
    if (fs.existsSync(indexPath)) {
      let html = fs.readFileSync(indexPath, 'utf8');

      // Replace title
      html = html.replace(/<title>.*?<\/title>/i, `<title>${siteTitle}</title>`);
      
      // Replace meta description
      html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${siteDescription}" />`);

      // Replace meta keywords
      if (html.includes('name="keywords"')) {
        html = html.replace(/<meta name="keywords" content=".*?" \/>/i, `<meta name="keywords" content="${seoKeywords}" />`);
      } else {
        html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${siteDescription}" />\n    <meta name="keywords" content="${seoKeywords}" />`);
      }

      // Replace application-name
      html = html.replace(/<meta name="application-name" content=".*?" \/>/i, `<meta name="application-name" content="${appFullName}" />`);

      // Replace og:title
      html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${siteTitle}" />`);

      // Replace og:description
      html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${siteDescription}" />`);

      // Replace twitter:title
      html = html.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${siteTitle}" />`);

      // Replace twitter:description
      html = html.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${siteDescription}" />`);

      // Ensure og:image and twitter:image use high-resolution 1200x630 og-image.png
      html = html.replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="https://vyrqonix.netlify.app/og-image.png" />`);
      html = html.replace(/<meta property="og:image:secure_url" content=".*?" \/>/i, `<meta property="og:image:secure_url" content="https://vyrqonix.netlify.app/og-image.png" />`);
      html = html.replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="https://vyrqonix.netlify.app/og-image.png" />`);

      // Google verification tag
      if (googleVerification) {
        if (html.includes('name="google-site-verification"')) {
          html = html.replace(/<meta name="google-site-verification" content=".*?" \/>/i, `<meta name="google-site-verification" content="${googleVerification}" />`);
        } else {
          html = html.replace('</head>', `    <meta name="google-site-verification" content="${googleVerification}" />\n  </head>`);
        }
      }

      fs.writeFileSync(indexPath, html, 'utf8');
      console.log(`Successfully synced metadata to index.html with title: "${siteTitle}"`);
    }

    process.exit(0);
  } catch (err) {
    console.warn('Could not sync Firestore metadata to index.html, using fallback:', err.message);
    process.exit(0);
  }
}

syncMeta();
