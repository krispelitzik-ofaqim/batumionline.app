#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'illustrations');

const STYLE = 'flat modern line-art illustration, soft pastel colors, clean vector style, centered subject, isolated on a plain solid white background, no text, no shadow, no frame';

const ITEMS = [
  { slug: 'hotels',        prompt: 'A charming beachfront hotel building with palm trees' },
  { slug: 'attractions',   prompt: 'A ferris wheel and colorful city skyline landmarks' },
  { slug: 'audio-tour',    prompt: 'Headphones with a tourist map and audio waves' },
  { slug: 'nightlife',     prompt: 'Cocktail glass with neon lights and music notes' },
  { slug: 'transport',     prompt: 'A yellow taxi car with a suitcase beside it' },
  { slug: 'restaurants',   prompt: 'A plate with Georgian khachapuri bread and wine glass' },
  { slug: 'shopping',      prompt: 'Colorful shopping bags with souvenirs and gifts' },
  { slug: 'sports',        prompt: 'A person doing yoga on the beach at sunrise' },
  { slug: 'extreme-ski',   prompt: 'Snowy mountains with ski equipment and cable car' },
  { slug: 'israeli-guides',prompt: 'A friendly tour guide with a small flag and a map' },
  { slug: 'health',        prompt: 'A medical cross with a stethoscope and first aid kit' },
  { slug: 'insurance',     prompt: 'A protective shield with an airplane and suitcase' },
  { slug: 'telecom',       prompt: 'A smartphone with SIM card and signal waves' },
  { slug: 'tips',          prompt: 'A glowing lightbulb with travel icons around it' },
  { slug: 'tax-refund',    prompt: 'Stacks of coins with a receipt and refund arrow' },
  { slug: 'welcome',       prompt: 'A friendly waving hand with a hello speech bubble' },
  { slug: 'landing',       prompt: 'An airplane landing at a sunny airport with palm trees' },
  { slug: 'history',       prompt: 'An open ancient book with a castle tower and scroll' },
  { slug: 'jewish-history',prompt: 'A Star of David with a menorah and ancient scroll' },
  { slug: 'going-home',    prompt: 'A suitcase with an airplane ticket and a small house' },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

async function generateOne({ slug, prompt }, idx) {
  const full = `${prompt}. ${STYLE}`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=1024&height=1024&nologo=true&seed=${1000 + idx}&model=flux`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`${slug}: response too small (${buf.length} bytes)`);
  const out = path.join(OUT_DIR, `${slug}.png`);
  fs.writeFileSync(out, buf);
  return out;
}

(async () => {
  console.log(`Generating ${ITEMS.length} illustrations via Pollinations → ${OUT_DIR}`);
  let ok = 0, fail = 0;
  for (let i = 0; i < ITEMS.length; i++) {
    try {
      const out = await generateOne(ITEMS[i], i);
      ok++;
      console.log(`✓ ${ITEMS[i].slug} → ${path.basename(out)} (${fs.statSync(out).size} bytes)`);
    } catch (e) {
      fail++;
      console.error(`✗ ${ITEMS[i].slug}: ${e.message}`);
    }
  }
  console.log(`\nDone. ${ok} ok, ${fail} failed.`);
})();
