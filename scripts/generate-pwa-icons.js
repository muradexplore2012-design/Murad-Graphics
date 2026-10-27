import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

async function generate() {
  console.log('Generating PWA Icons...');
  const logoPath = path.resolve(publicDir, 'logo.png');

  // 1. Get trimmed logo buffer (the 3D V emblem)
  const trimmedBuffer = await sharp(logoPath).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  console.log(`Trimmed logo: ${trimmedMeta.width}x${trimmedMeta.height}`);

  const aspectRatio = trimmedMeta.width / trimmedMeta.height; // ~1.42

  // Helper to create resized emblem
  async function getResizedEmblem(targetW) {
    const targetH = Math.round(targetW / aspectRatio);
    return {
      buffer: await sharp(trimmedBuffer).resize(targetW, targetH, { fit: 'contain' }).toBuffer(),
      width: targetW,
      height: targetH
    };
  }

  // Helper to create pure white monochrome silhouette
  async function getMonochromeEmblem(emblemBuffer, w, h) {
    const { data } = await sharp(emblemBuffer).raw().toBuffer({ resolveWithObject: true });
    const mono = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      mono[i] = 255;
      mono[i + 1] = 255;
      mono[i + 2] = 255;
      mono[i + 3] = alpha;
    }
    return sharp(mono, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  }

  // 1. MASKABLE 512x512 (Safe Zone: 270px width)
  const emblem512 = await getResizedEmblem(270);
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 11, g: 15, b: 25, alpha: 1 } // #0b0f19
    }
  })
  .composite([{
    input: emblem512.buffer,
    top: Math.round((512 - emblem512.height) / 2),
    left: Math.round((512 - emblem512.width) / 2)
  }])
  .png({ quality: 95 })
  .toFile(path.resolve(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // 2. MASKABLE 192x192 (Safe Zone: 101px width)
  const emblem192 = await getResizedEmblem(101);
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 11, g: 15, b: 25, alpha: 1 }
    }
  })
  .composite([{
    input: emblem192.buffer,
    top: Math.round((192 - emblem192.height) / 2),
    left: Math.round((192 - emblem192.width) / 2)
  }])
  .png({ quality: 95 })
  .toFile(path.resolve(publicDir, 'pwa-maskable-192x192.png'));
  console.log('Created pwa-maskable-192x192.png');

  // 3. MONOCHROME 512x512 (For Android Themed Icons)
  const mono512 = await getMonochromeEmblem(emblem512.buffer, emblem512.width, emblem512.height);
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{
    input: mono512,
    top: Math.round((512 - emblem512.height) / 2),
    left: Math.round((512 - emblem512.width) / 2)
  }])
  .png()
  .toFile(path.resolve(publicDir, 'pwa-monochrome-512x512.png'));
  console.log('Created pwa-monochrome-512x512.png');

  // 4. MONOCHROME 192x192
  const mono192 = await getMonochromeEmblem(emblem192.buffer, emblem192.width, emblem192.height);
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{
    input: mono192,
    top: Math.round((192 - emblem192.height) / 2),
    left: Math.round((192 - emblem192.width) / 2)
  }])
  .png()
  .toFile(path.resolve(publicDir, 'pwa-monochrome-192x192.png'));
  console.log('Created pwa-monochrome-192x192.png');

  // 5. STANDARD PWA 512x512 (purpose: any)
  // With solid background & safe zone so non-maskable launchers don't crop
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 11, g: 15, b: 25, alpha: 1 }
    }
  })
  .composite([{
    input: emblem512.buffer,
    top: Math.round((512 - emblem512.height) / 2),
    left: Math.round((512 - emblem512.width) / 2)
  }])
  .png({ quality: 95 })
  .toFile(path.resolve(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 6. STANDARD PWA 192x192 (purpose: any)
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 11, g: 15, b: 25, alpha: 1 }
    }
  })
  .composite([{
    input: emblem192.buffer,
    top: Math.round((192 - emblem192.height) / 2),
    left: Math.round((192 - emblem192.width) / 2)
  }])
  .png({ quality: 95 })
  .toFile(path.resolve(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 7. APPLE TOUCH ICON (180x180)
  const emblem180 = await getResizedEmblem(98);
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 11, g: 15, b: 25, alpha: 1 }
    }
  })
  .composite([{
    input: emblem180.buffer,
    top: Math.round((180 - emblem180.height) / 2),
    left: Math.round((180 - emblem180.width) / 2)
  }])
  .png({ quality: 95 })
  .toFile(path.resolve(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 8. Copy to brain folder for user preview
  fs.copyFileSync(
    path.resolve(publicDir, 'pwa-maskable-512x512.png'),
    'C:/Users/rafia/.gemini/antigravity/brain/77f83fd6-4057-4896-b2c7-dbe0c0b69136/pwa_maskable_preview.png'
  );
  fs.copyFileSync(
    path.resolve(publicDir, 'pwa-monochrome-512x512.png'),
    'C:/Users/rafia/.gemini/antigravity/brain/77f83fd6-4057-4896-b2c7-dbe0c0b69136/pwa_monochrome_preview.png'
  );

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
