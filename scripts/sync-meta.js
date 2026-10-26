import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../index.html');

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
    const siteTitle = data.siteTitle || (data.siteName ? `${data.siteName} | Digital Marketplace` : 'Vyrqonix | Graphic Resources, Software & Game');
    const siteDescription = data.siteDescription || 'A digital marketplace for graphic design resources, editable design files, software and apps.';

    if (!fs.existsSync(indexPath)) {
      console.warn('index.html not found at', indexPath);
      process.exit(0);
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    // Replace title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${siteTitle}</title>`);
    
    // Replace meta description
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${siteDescription}" />`);

    // Replace og:title
    html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${siteTitle}" />`);

    // Replace og:description
    html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${siteDescription}" />`);

    // Replace twitter:title
    html = html.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${siteTitle}" />`);

    // Replace twitter:description
    html = html.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${siteDescription}" />`);

    fs.writeFileSync(indexPath, html, 'utf8');
    console.log(`Successfully synced metadata to index.html with title: "${siteTitle}"`);
    process.exit(0);
  } catch (err) {
    console.warn('Could not sync Firestore metadata to index.html, using fallback:', err.message);
    process.exit(0);
  }
}

syncMeta();
