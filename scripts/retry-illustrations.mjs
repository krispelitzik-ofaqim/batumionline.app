#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'illustrations');

const STYLE = 'flat modern line-art illustration, soft pastel colors, clean vector style, centered subject, plain white background, no text';

const ITEMS = [
  { slug: 'attractions',   prompt: 'A big ferris wheel with colorful city buildings' },
  { slug: 'nightlife',     prompt: 'A cocktail glass with neon lights' },
  { slug: 'restaurants',   prompt: 'A dinner plate with bread and a wine glass' },
  { slug: 'telecom',       prompt: 'A smartphone with signal waves' },
  { slug: 'tax-refund',    prompt: 'Coins and a receipt with a refund arrow' },
  { slug: 'welcome',       prompt: 'A waving hand with a speech bubble' },
  { slug: 'jewish-history',prompt: 'A Star of David with an ancient scroll' },
];

async function tryOnce({ slug, prompt }, seed) {
  const full = `${prompt}. ${STYLE}`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`too small ${buf.length}B`);
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.png`), buf);
  return buf.length;
}

(async () => {
  for (const item of ITEMS) {
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      try {
        const size = await tryOnce(item, 5000 + attempt * 137);
        console.log(`✓ ${item.slug} (attempt ${attempt}, ${size}B)`);
        done = true;
      } catch (e) {
        console.warn(`… ${item.slug} attempt ${attempt}: ${e.message}`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    if (!done) console.error(`✗ ${item.slug} — giving up`);
  }
})();
