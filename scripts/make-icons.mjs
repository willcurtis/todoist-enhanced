/** Generate installable app icons from the supplied, unmodified Tech Shed logo. */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../public/', import.meta.url);
const logo = new URL('brand-logo.png', root);
const bytes = await readFile(logo);
for (const [name, size, scale] of [
  ['icon-192.png', 192, .9], ['icon-512.png', 512, .9],
  ['apple-touch-icon.png', 180, .9],
  ['icon-maskable-192.png', 192, .72], ['icon-maskable-512.png', 512, .72],
]) {
  const mark = await sharp(bytes).resize(Math.round(size * scale), Math.round(size * scale), { fit: 'contain' }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#0a0a0a' } })
    .composite([{ input: mark, gravity: 'centre' }]).flatten({ background: '#0a0a0a' }).png().toFile(new URL(name, root).pathname);
}
await writeFile(new URL('favicon.svg', root), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><image width="640" height="640" href="data:image/png;base64,${bytes.toString('base64')}"/></svg>`);
// A logo card, rather than an outdated screenshot of the upstream product.
const mark = await sharp(bytes).resize(540, 540).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#0a0a0a' } })
  .composite([{ input: mark, gravity: 'centre' }]).png().toFile(new URL('og-image.png', root).pathname);
