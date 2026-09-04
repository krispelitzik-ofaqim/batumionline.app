require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
let Expo = null;
try { Expo = require('expo-server-sdk').Expo; } catch (e) { console.warn('expo-server-sdk not available'); }
const expoClient = Expo ? new Expo() : null;

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = (process.env.DATA_DIR || __dirname).trim();
const DB_PATH = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const GALLERY_DIR = path.join(UPLOADS_DIR, 'gallery');
const LISTINGS_DIR = path.join(UPLOADS_DIR, 'מודעות-נדלן');
const LISTINGS_DIR_LEGACY = path.join(UPLOADS_DIR, 'listings');
if (!fs.existsSync(GALLERY_DIR)) fs.mkdirSync(GALLERY_DIR, { recursive: true });
if (!fs.existsSync(LISTINGS_DIR)) fs.mkdirSync(LISTINGS_DIR, { recursive: true });
// Migrate legacy 'listings' folder if exists
try {
  if (fs.existsSync(LISTINGS_DIR_LEGACY)) {
    for (const f of fs.readdirSync(LISTINGS_DIR_LEGACY)) {
      const src = path.join(LISTINGS_DIR_LEGACY, f);
      const dst = path.join(LISTINGS_DIR, f);
      if (!fs.existsSync(dst) && fs.statSync(src).isFile()) fs.copyFileSync(src, dst);
    }
  }
} catch {}
if (!fs.existsSync(DB_PATH)) {
  const seed = path.join(__dirname, 'db.json');
  if (fs.existsSync(seed) && seed !== DB_PATH) {
    fs.copyFileSync(seed, DB_PATH);
  } else {
    fs.writeFileSync(DB_PATH, '{}', 'utf-8');
  }
}

// Auto-recover listings folder from db on every startup (Railway volume isn't persistent across deploys)
try {
  const FALLBACK = path.join(__dirname, 'uploads');
  const dbRaw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  for (const l of (dbRaw.listings || [])) {
    for (const img of (l.images || [])) {
      const filename = path.basename(decodeURIComponent(String(img)));
      const dst = path.join(LISTINGS_DIR, filename);
      if (fs.existsSync(dst)) continue;
      const src1 = path.join(UPLOADS_DIR, filename);
      const src2 = path.join(FALLBACK, filename);
      const src = fs.existsSync(src1) ? src1 : (fs.existsSync(src2) ? src2 : null);
      if (src) fs.copyFileSync(src, dst);
    }
  }
} catch {}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb', strict: false }));

// Disable CDN caching for all /api/* endpoints (Fastly was serving stale data)
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});
// Serve git-committed (compressed) uploads first; volume serves new uploads only
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(UPLOADS_DIR));
// Serve purchased Batumi photo library (used as news/fallback images)
const BATUMI_IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images', 'google');
app.use('/batumi-images', express.static(BATUMI_IMAGES_DIR, { maxAge: '7d' }));
let batumiImagesCache = null;
app.get('/api/batumi-images', (_req, res) => {
  try {
    if (!batumiImagesCache) {
      batumiImagesCache = fs.readdirSync(BATUMI_IMAGES_DIR)
        .filter(f => /\.(jpe?g|png|webp)$/i.test(f));
    }
    res.json({ images: batumiImagesCache });
  } catch (e) {
    res.json({ images: [] });
  }
});

// ─── Helpers ───────────────────────────────────────────────────

function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Multer config for file uploads ───────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp3|wav|m4a|aac|mp4)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  },
});

const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, GALLERY_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`;
    cb(null, name);
  },
});
const galleryUpload = multer({
  storage: galleryStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    cb(allowed.test(path.extname(file.originalname)) ? null : new Error('Image only'), allowed.test(path.extname(file.originalname)));
  },
});

const listingsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LISTINGS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 10000)}${ext}`);
  },
});
const listingsUpload = multer({
  storage: listingsStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpe?g|png|webp|gif|mp4|mov)$/i;
    cb(null, allowed.test(file.originalname));
  },
});

// ─── API Routes ───────────────────────────────────────────────

// GET /api/content — fetch all content
app.get('/api/content', (req, res) => {
  try {
    const data = readDB();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read database' });
  }
});

// GET /api/content/:section — fetch a specific section
app.get('/api/content/:section', (req, res) => {
  try {
    const data = readDB();
    const section = req.params.section;
    if (data[section] !== undefined) {
      res.json({ success: true, data: data[section] });
    } else {
      res.status(404).json({ success: false, error: `Section "${section}" not found` });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read database' });
  }
});

// PUT /api/content — update all content
app.put('/api/content', (req, res) => {
  try {
    const newData = req.body;
    if (!newData || typeof newData !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid data' });
    }
    writeDB(newData);
    res.json({ success: true, message: 'Content updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to write database' });
  }
});

// PUT /api/content/:section — update a specific section
app.put('/api/content/:section', (req, res) => {
  try {
    const data = readDB();
    const section = req.params.section;
    data[section] = req.body;
    writeDB(data);
    res.json({ success: true, message: `Section "${section}" updated` });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to write database' });
  }
});

app.post('/api/push/register', (req, res) => {
  try {
    const { token, platform } = req.body || {};
    if (!token || !String(token).startsWith('ExponentPushToken')) return res.status(400).json({ success: false, error: 'invalid token' });
    const data = readDB();
    const tokens = Array.isArray(data.pushTokens) ? data.pushTokens : [];
    const now = new Date().toISOString();
    const existing = tokens.find(t => t.token === token);
    if (existing) { existing.lastSeen = now; if (platform) existing.platform = platform; }
    else tokens.push({ token, platform: platform || 'unknown', registeredAt: now, lastSeen: now });
    data.pushTokens = tokens;
    writeDB(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'server error' });
  }
});

app.post('/api/push/send', async (req, res) => {
  try {
    if (!expoClient) return res.status(500).json({ success: false, error: 'push server not available' });
    const { title, body, data: extra } = req.body || {};
    if (!title || !body) return res.status(400).json({ success: false, error: 'title and body required' });
    const db = readDB();
    const tokens = Array.isArray(db.pushTokens) ? db.pushTokens : [];
    const messages = [];
    for (const t of tokens) {
      if (!Expo.isExpoPushToken(t.token)) continue;
      messages.push({ to: t.token, sound: 'default', title, body, data: extra || {} });
    }
    if (messages.length === 0) return res.json({ success: true, sent: 0 });
    const chunks = expoClient.chunkPushNotifications(messages);
    const tickets = [];
    for (const chunk of chunks) {
      try { const r = await expoClient.sendPushNotificationsAsync(chunk); tickets.push(...r); } catch (e) { console.warn('push chunk error', e); }
    }
    db.pushHistory = (db.pushHistory || []).concat([{ id: `ph_${Date.now()}`, title, body, data: extra || {}, sentAt: new Date().toISOString(), count: messages.length }]).slice(-50);
    writeDB(db);
    res.json({ success: true, sent: messages.length, tickets });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err && err.message || err) });
  }
});

app.get('/api/push/tokens', (req, res) => {
  try {
    const data = readDB();
    res.json({ success: true, count: (data.pushTokens || []).length, history: data.pushHistory || [] });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/coupons/validate', (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code || !String(code).trim()) return res.status(400).json({ success: false, error: 'code required' });
    const data = readDB();
    const list = Array.isArray(data.coupons) ? data.coupons : [];
    const c = list.find(x => String(x.code || '').trim().toUpperCase() === String(code).trim().toUpperCase());
    if (!c) return res.json({ success: false, error: 'קוד לא נמצא' });
    if (!c.visible) return res.json({ success: false, error: 'קוד אינו פעיל' });
    const now = new Date();
    if (c.startAt && new Date(c.startAt) > now) return res.json({ success: false, error: 'הקוד עוד לא בתוקף' });
    if (c.endAt && new Date(c.endAt + 'T23:59:59') < now) return res.json({ success: false, error: 'הקוד פג תוקף' });
    if (typeof c.maxUses === 'number' && c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses) return res.json({ success: false, error: 'הקוד נוצל במלואו' });
    c.usedCount = (c.usedCount || 0) + 1;
    c.lastUsedAt = new Date().toISOString();
    data.coupons = list.map(x => x.id === c.id ? c : x);
    writeDB(data);
    res.json({ success: true, coupon: { id: c.id, code: c.code, type: c.type, value: c.value, label: c.label || '' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'server error' });
  }
});

app.post('/api/contact', (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !String(name).trim() || !message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: 'name and message are required' });
    }
    const data = readDB();
    const submissions = Array.isArray(data.contactSubmissions) ? data.contactSubmissions : [];
    submissions.unshift({
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: String(name).trim(),
      email: String(email || '').trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
      read: false,
    });
    data.contactSubmissions = submissions.slice(0, 500);
    writeDB(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save submission' });
  }
});

app.get('/api/contact', (req, res) => {
  try {
    const data = readDB();
    res.json({ success: true, data: Array.isArray(data.contactSubmissions) ? data.contactSubmissions : [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read submissions' });
  }
});

// GET /api/uploads — list all uploaded files with tags
app.get('/api/uploads', (req, res) => {
  try {
    const data = readDB();
    const tags = data.mediaTags || {};
    const names = data.fileNames || {};
    const gitUploads = path.join(__dirname, 'uploads');
    const collect = (dir) => {
      try {
        return fs.readdirSync(dir)
          .filter(f => !f.startsWith('.') && !fs.statSync(path.join(dir, f)).isDirectory())
          .map(f => ({ f, dir }));
      } catch { return []; }
    };
    const seen = new Set();
    const all = [];
    for (const { f, dir } of [...collect(UPLOADS_DIR), ...(gitUploads !== UPLOADS_DIR ? collect(gitUploads) : [])]) {
      if (seen.has(f)) continue;
      seen.add(f);
      const stat = fs.statSync(path.join(dir, f));
      all.push({
        filename: f,
        originalName: names[f] || '',
        url: `http://localhost:${PORT}/uploads/${f}`,
        size: stat.size,
        mtime: stat.mtimeMs,
        tags: tags[f] || [],
      });
    }
    all.sort((a, b) => b.mtime - a.mtime);
    res.json({ success: true, files: all });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list uploads' });
  }
});

// PUT /api/uploads/:filename/tags — set tags for a file
app.put('/api/uploads/:filename/tags', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    const data = readDB();
    if (!data.mediaTags) data.mediaTags = {};
    if (tags.length === 0) delete data.mediaTags[filename];
    else data.mediaTags[filename] = tags;
    writeDB(data);
    res.json({ success: true, tags });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to set tags' });
  }
});

// DELETE /api/uploads/:filename — delete an uploaded file
app.delete('/api/uploads/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const fp = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(fp)) return res.status(404).json({ success: false, error: 'Not found' });
    fs.unlinkSync(fp);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete' });
  }
});

// GET /api/gallery — list files tagged 'gallery' from main uploads (ordered)
app.get('/api/gallery', (req, res) => {
  try {
    const data = readDB();
    const tags = data.mediaTags || {};
    const order = Array.isArray(data.galleryOrder) ? data.galleryOrder : [];
    const onDisk = fs.readdirSync(UPLOADS_DIR)
      .filter(f => !f.startsWith('.') && !fs.statSync(path.join(UPLOADS_DIR, f)).isDirectory())
      .filter(f => (tags[f] || []).includes('gallery'));
    const ordered = [
      ...order.filter(f => onDisk.includes(f)),
      ...onDisk.filter(f => !order.includes(f)),
    ];
    const files = ordered.map(f => ({
      filename: f,
      url: `http://localhost:${PORT}/uploads/${f}`,
    }));
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list gallery' });
  }
});

// POST /api/gallery — upload an image to the gallery
app.post('/api/gallery', galleryUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
  res.json({
    success: true,
    filename: req.file.filename,
    url: `http://localhost:${PORT}/uploads/gallery/${req.file.filename}`,
  });
});

// DELETE /api/gallery/:filename
app.delete('/api/gallery/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const fp = path.join(GALLERY_DIR, filename);
    if (!fs.existsSync(fp)) return res.status(404).json({ success: false, error: 'Not found' });
    fs.unlinkSync(fp);
    const data = readDB();
    if (Array.isArray(data.galleryOrder)) {
      data.galleryOrder = data.galleryOrder.filter(f => f !== filename);
      writeDB(data);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete' });
  }
});

// PUT /api/gallery/order — set explicit order
app.put('/api/gallery/order', (req, res) => {
  try {
    const order = Array.isArray(req.body.order) ? req.body.order : [];
    const data = readDB();
    data.galleryOrder = order;
    writeDB(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save order' });
  }
});

// POST /api/upload — upload images and audio files
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    // Save original name mapping (fix Hebrew encoding)
    const db = readDB();
    if (!db.fileNames) db.fileNames = {};
    let origName = req.file.originalname;
    try { origName = Buffer.from(origName, 'latin1').toString('utf8'); } catch {}
    db.fileNames[req.file.filename] = origName;
    writeDB(db);
    res.json({
      success: true,
      url,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// POST /api/upload/multiple — upload multiple files
app.post('/api/upload/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }
    const files = req.files.map(f => ({
      url: `http://localhost:${PORT}/uploads/${f.filename}`,
      filename: f.filename,
      originalName: f.originalname,
      size: f.size,
    }));
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// ─── Geostat: Adjara construction turnover (yearly) ──────────
const geostatCache = { data: null, fetchedAt: 0 };
const GEOSTAT_CACHE_MS = 24 * 60 * 60 * 1000; // 24h
app.get('/api/geostat/construction-adjara', async (_req, res) => {
  if (Date.now() - geostatCache.fetchedAt < GEOSTAT_CACHE_MS && geostatCache.data) {
    return res.json({ ...geostatCache.data, cached: true });
  }
  try {
    const url = 'https://pc-axis.geostat.ge/PXWeb/api/v1/en/Database/Construction/Construction%20By%20kind%20of%20economic%20activity%20NACE%20rev.2/Turnover/Turnover_by_regions.px';
    const meta = await fetch(url).then(r => r.json());
    const periodVar = meta.variables.find(v => v.code === 'Period');
    const years = periodVar.valueTexts;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: [{ code: 'Regions', selection: { filter: 'item', values: ['2'] } }],
        response: { format: 'json' },
      }),
    });
    const text = await r.text();
    const stripped = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
    const data = JSON.parse(stripped);
    // Convert GEL to USD using current NBG rate
    let usdPerGel = 1 / 2.7; // fallback
    try {
      const nbg = await fetch('https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/');
      const arr = await nbg.json();
      const today = arr?.[0]?.currencies || [];
      const usd = today.find(c => c.code === 'USD');
      if (usd?.rate && usd?.quantity) {
        // rate is GEL per (quantity) USD; to convert GEL→USD divide by (rate / quantity)
        usdPerGel = usd.quantity / usd.rate;
      }
    } catch {}
    const series = (data.data || []).map((row) => {
      const periodIdx = parseInt(row.key[0], 10);
      const gel = parseFloat(row.values[0]) || 0;
      return {
        year: years[periodIdx],
        value: Math.round(gel * usdPerGel * 10) / 10,
      };
    }).filter(p => p.year);
    const payload = { unit: 'mln USD', region: 'Adjara (Batumi area)', series, usdPerGel };
    geostatCache.data = payload;
    geostatCache.fetchedAt = Date.now();
    res.json({ ...payload, cached: false });
  } catch (err) {
    console.warn(`[geostat] fetch failed: ${err.message}`);
    res.status(502).json({ error: 'Geostat fetch failed' });
  }
});

// ─── Flights proxy (AeroDataBox via RapidAPI) ────────────────
const BUS_ICAO = 'UGSB'; // Batumi International Airport
const flightsCache = { arrivals: null, departures: null, fetchedAt: 0 };
const CACHE_MS = 5 * 60 * 1000; // 5 minutes
const marineCache = { data: null, fetchedAt: 0 };
const MARINE_CACHE_MS = 60 * 60 * 1000; // 1 hour (Stormglass free = 50/day)
const unsplashCache = {}; // keyed by query
const UNSPLASH_CACHE_MS = 24 * 60 * 60 * 1000; // 24 hours (free = 50/hour)
const placesCache = {}; // keyed by query
const PLACES_CACHE_MS = 24 * 60 * 60 * 1000; // 24 hours

app.get('/api/flights', async (req, res) => {
  const key = process.env.AERODATABOX_KEY;
  const host = process.env.AERODATABOX_HOST || 'aerodatabox.p.rapidapi.com';
  if (!key) {
    return res.status(503).json({ error: 'AERODATABOX_KEY not configured' });
  }

  if (Date.now() - flightsCache.fetchedAt < CACHE_MS && flightsCache.arrivals) {
    return res.json({ arrivals: flightsCache.arrivals, departures: flightsCache.departures, cached: true });
  }

  try {
    const now = new Date();
    const startBase = now.getTime() - 2 * 60 * 60 * 1000; // 2h lookback
    const WIN_MS = 12 * 60 * 60 * 1000;
    const NUM_WINDOWS = 3; // 3 × 12h = 36h total
    const fmt = (d) => new Date(d).toISOString().slice(0, 16);

    // Sequential with 1.1s spacing — AeroDataBox BASIC plan is 1 req/sec.
    const results = [];
    for (let i = 0; i < NUM_WINDOWS; i++) {
      const s = startBase + i * WIN_MS;
      const e = s + WIN_MS;
      const url = `https://${host}/flights/airports/icao/${BUS_ICAO}/${fmt(s)}/${fmt(e)}?withLeg=true&direction=Both&withCancelled=true&withCodeshared=true&withCargo=false&withPrivate=false&withLocation=false`;
      try {
        const r = await fetch(url, {
          headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': host },
        });
        if (!r.ok) {
          const body = await r.text().catch(() => '');
          console.warn(`[flights] window ${i} HTTP ${r.status}: ${body.slice(0, 200)}`);
          results.push(null);
        } else {
          results.push(await r.json());
        }
      } catch (err) {
        console.warn(`[flights] window ${i} fetch failed: ${err.message}`);
        results.push(null);
      }
      if (i < NUM_WINDOWS - 1) await new Promise(res => setTimeout(res, 1500));
    }
    const allArrivals = [];
    const allDepartures = [];
    let successfulWindows = 0;
    for (const r of results) {
      if (!r) continue;
      successfulWindows++;
      if (Array.isArray(r.arrivals)) allArrivals.push(...r.arrivals);
      if (Array.isArray(r.departures)) allDepartures.push(...r.departures);
    }

    // Dedupe by flight number + scheduled time
    const dedupe = (list, timeKey) => {
      const seen = new Map();
      for (const f of list) {
        const t = f?.[timeKey]?.scheduledTime?.utc || f?.[timeKey]?.scheduledTime?.local || '';
        const key = `${f?.number || ''}_${t}`;
        if (!seen.has(key)) seen.set(key, f);
      }
      return Array.from(seen.values());
    };
    const arrivals = dedupe(allArrivals, 'arrival').sort((a, b) => (a?.arrival?.scheduledTime?.utc || '').localeCompare(b?.arrival?.scheduledTime?.utc || ''));
    const departures = dedupe(allDepartures, 'departure').sort((a, b) => (a?.departure?.scheduledTime?.utc || '').localeCompare(b?.departure?.scheduledTime?.utc || ''));

    const hasData = arrivals.length > 0 || departures.length > 0;
    if (hasData && successfulWindows > 0) {
      flightsCache.arrivals = arrivals;
      flightsCache.departures = departures;
      flightsCache.fetchedAt = Date.now();
    } else {
      console.warn(`[flights] empty result (${successfulWindows}/${NUM_WINDOWS} windows succeeded) — not caching`);
    }
    res.json({ arrivals, departures, cached: false, windows: NUM_WINDOWS, successfulWindows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Marine weather (Stormglass) ───────────────────────────────
app.get('/api/marine', async (req, res) => {
  const key = process.env.STORMGLASS_KEY;
  if (!key) return res.status(503).json({ error: 'STORMGLASS_KEY not configured' });

  if (Date.now() - marineCache.fetchedAt < MARINE_CACHE_MS && marineCache.data) {
    return res.json({ ...marineCache.data, cached: true });
  }

  try {
    const params = 'waveHeight,waveDirection,wavePeriod,waterTemperature,windSpeed,windDirection,gust,visibility,seaLevel,airTemperature';
    const url = `https://api.stormglass.io/v2/weather/point?lat=41.6168&lng=41.6367&params=${params}&source=sg`;
    const response = await fetch(url, { headers: { Authorization: key } });
    if (!response.ok) return res.status(response.status).json({ error: `Upstream ${response.status}` });
    const data = await response.json();

    const nowHour = new Date();
    nowHour.setMinutes(0, 0, 0);
    const nowIso = nowHour.toISOString().slice(0, 13);
    const currentHour = (data.hours || []).find(h => (h.time || '').startsWith(nowIso)) || (data.hours || [])[0] || null;

    if (!currentHour) return res.status(502).json({ error: 'no data' });

    const payload = {
      waveHeight: currentHour.waveHeight?.sg ?? null,
      waveDirection: currentHour.waveDirection?.sg ?? null,
      wavePeriod: currentHour.wavePeriod?.sg ?? null,
      waterTemp: currentHour.waterTemperature?.sg ?? null,
      airTemp: currentHour.airTemperature?.sg ?? null,
      windSpeed: currentHour.windSpeed?.sg ?? null,
      windDirection: currentHour.windDirection?.sg ?? null,
      gust: currentHour.gust?.sg ?? null,
      visibility: currentHour.visibility?.sg ?? null,
      seaLevel: currentHour.seaLevel?.sg ?? null,
      time: currentHour.time,
    };
    marineCache.data = payload;
    marineCache.fetchedAt = Date.now();
    res.json({ ...payload, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Unsplash photos ─────────────────────────────────────────
app.get('/api/unsplash', async (req, res) => {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return res.status(503).json({ error: 'UNSPLASH_ACCESS_KEY not configured' });

  const query = (req.query.q || 'batumi').toString();
  const count = Math.min(parseInt(req.query.count) || 20, 30);
  const cacheKey = `${query}:${count}`;
  const cached = unsplashCache[cacheKey];
  if (cached && Date.now() - cached.fetchedAt < UNSPLASH_CACHE_MS) {
    return res.json({ photos: cached.data, cached: true });
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;
    const response = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
    if (!response.ok) return res.status(response.status).json({ error: `Upstream ${response.status}` });
    const data = await response.json();
    const photos = (data.results || []).map(p => ({
      id: p.id,
      url: p.urls?.regular,
      thumb: p.urls?.small,
      alt: p.alt_description || p.description || '',
      author: p.user?.name || '',
      authorLink: `${p.user?.links?.html}?utm_source=batumionline&utm_medium=referral` || '',
      downloadLink: p.links?.download_location,
    }));
    unsplashCache[cacheKey] = { data: photos, fetchedAt: Date.now() };
    res.json({ photos, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Google Places photo proxy ────────────────────────────────
// Handing the app a places.googleapis.com media URL meant Google billed us for
// every photo every viewer loaded — that was the whole Places bill. We now fetch
// each photo once, keep it on disk, and serve it ourselves. It also stops the
// API key from travelling inside image URLs.
const PLACES_PHOTO_DIR = path.join(UPLOADS_DIR, 'places');
if (!fs.existsSync(PLACES_PHOTO_DIR)) fs.mkdirSync(PLACES_PHOTO_DIR, { recursive: true });

function placePhotoFile(ref, w) {
  return path.join(PLACES_PHOTO_DIR, crypto.createHash('sha1').update(`${ref}|${w}`).digest('hex') + '.jpg');
}
// The URL the app gets. Same shape for every caller, so nothing leaks the key.
function placePhotoUrl(ref, w = 800) {
  return `/api/places/photo?ref=${encodeURIComponent(ref)}&w=${w}`;
}

app.get('/api/places/photo', async (req, res) => {
  const ref = String(req.query.ref || '');
  const w = Math.min(1600, Math.max(200, parseInt(req.query.w, 10) || 800));
  // Only ever a Places photo name — never an arbitrary URL.
  if (!/^places\/[A-Za-z0-9_\-]+\/photos\/[A-Za-z0-9_\-]+$/.test(ref)) return res.status(400).end();
  const file = placePhotoFile(ref, w);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (fs.existsSync(file)) return res.sendFile(file);
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(503).end();
  try {
    const r = await fetch(`https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${w}&key=${key}`, { redirect: 'follow' });
    if (!r.ok) return res.status(r.status).end();
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFile(file, buf, () => {});
    res.set('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    return res.end(buf);
  } catch { return res.status(502).end(); }
});

// ─── Google Places ────────────────────────────────────────────
app.get('/api/places', async (req, res) => {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(503).json({ error: 'GOOGLE_PLACES_KEY not configured' });
  const query = (req.query.q || '').toString().trim();
  if (!query) return res.status(400).json({ error: 'q required' });
  const lang = (req.query.lang || 'he').toString() === 'en' ? 'en' : 'he';

  const cacheKey = `${lang}:${query.toLowerCase()}`;
  const cached = placesCache[cacheKey];
  if (cached && Date.now() - cached.fetchedAt < PLACES_CACHE_MS) {
    return res.json({ ...cached.data, cached: true });
  }

  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.googleMapsUri,places.websiteUri,places.currentOpeningHours,places.formattedAddress,places.location,places.photos,places.photos.authorAttributions',
      },
      body: JSON.stringify({ textQuery: query, languageCode: lang }),
    });
    if (!r.ok) return res.status(r.status).json({ error: `Upstream ${r.status}` });
    const data = await r.json();
    const p = (data.places || [])[0];
    if (!p) { placesCache[cacheKey] = { data: { found: false }, fetchedAt: Date.now() }; return res.json({ found: false, cached: false }); }

    const photos = (p.photos || []).slice(0, 10).map(ph => ({
      ref: ph.name,
      url: placePhotoUrl(ph.name, 800),
    }));

    const payload = {
      found: true,
      name: p.displayName?.text || '',
      rating: p.rating ?? null,
      reviews: p.userRatingCount ?? null,
      address: p.formattedAddress || '',
      phone: p.internationalPhoneNumber || '',
      website: p.websiteUri || '',
      mapsUri: p.googleMapsUri || '',
      location: p.location ? { lat: p.location.latitude, lng: p.location.longitude } : null,
      openingHours: p.currentOpeningHours?.weekdayDescriptions || [],
      openNow: p.currentOpeningHours?.openNow ?? null,
      photos,
    };
    placesCache[cacheKey] = { data: payload, fetchedAt: Date.now() };
    res.json({ ...payload, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: backfill hotel/villa photos from Places API ───────
app.post('/api/admin/fetch-photos', async (req, res) => {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(503).json({ error: 'No key' });
  const { categoryId, placeholder = '/uploads/city.jpg' } = req.body || {};
  if (!categoryId) return res.status(400).json({ error: 'categoryId required' });

  const db = readDB();
  const findCategory = (items) => {
    for (const it of (items || [])) {
      if (it.id === categoryId) return it;
      const r = findCategory(it.children);
      if (r) return r;
    }
    return null;
  };
  const cat = findCategory(db.mainCategories) || findCategory(db.extraCategories);
  if (!cat || !Array.isArray(cat.hotels)) return res.status(404).json({ error: 'Category not found or no hotels' });

  const results = [];
  for (const h of cat.hotels) {
    if (h.image && h.image !== placeholder && !h.image.includes('city.jpg')) {
      results.push({ id: h.id, title: h.title, status: 'skip' });
      continue;
    }
    try {
      const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'places.photos,places.displayName,places.photos.authorAttributions',
        },
        body: JSON.stringify({ textQuery: `${h.titleEn || h.title} Batumi`, languageCode: 'he' }),
      });
      const data = await r.json();
      const p = (data.places || [])[0];
      const photo0 = p?.photos?.[0];
      const photoName = photo0?.name;
      if (!photoName) { results.push({ id: h.id, title: h.title, status: 'no-photo' }); continue; }
      const photoUrl = placePhotoUrl(photoName, 800);
      const imgRes = await fetch(photoUrl);
      if (!imgRes.ok) { results.push({ id: h.id, title: h.title, status: 'fetch-failed' }); continue; }
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const safe = (h.id || `hotel_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `${safe}_${Date.now()}.jpg`;
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), buf);
      h.image = `/uploads/${filename}`;
      const attr = photo0?.authorAttributions?.[0];
      if (attr?.displayName) h.photoAttribution = { name: attr.displayName, uri: attr.uri || '' };
      results.push({ id: h.id, title: h.title, status: 'updated', image: h.image });
    } catch (e) {
      results.push({ id: h.id, title: h.title, status: 'error', error: e.message });
    }
  }
  writeDB(db);
  res.json({ category: cat.title, count: results.length, results });
});

// ─── Admin: set sub-category tile icon from first hotel image ─
app.post('/api/admin/set-tile-icon', (req, res) => {
  const { categoryId } = req.body || {};
  if (!categoryId) return res.status(400).json({ error: 'categoryId required' });
  const db = readDB();
  const find = (items) => {
    for (const it of (items || [])) {
      if (it.id === categoryId) return it;
      const r = find(it.children);
      if (r) return r;
    }
    return null;
  };
  const cat = find(db.mainCategories) || find(db.extraCategories);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const first = (cat.hotels || []).find(h => h.visible !== false && h.image && h.image.startsWith('/uploads/') && !h.image.includes('city.jpg'));
  if (!first) return res.status(404).json({ error: 'No suitable hotel image' });
  cat.icon = first.image;
  writeDB(db);
  res.json({ category: cat.title, icon: cat.icon });
});

// ─── Guide recommendation/self-upload ─────────────────────────
app.post('/api/guide-recommend', (req, res) => {
  try {
    const { categoryId, mode, name, phone, languages, whatsapp, facebook, website, note, photo } = req.body || {};
    if (!name || !phone) return res.status(400).json({ error: 'name+phone required' });
    const db = readDB();
    if (!Array.isArray(db.guideRecommendations)) db.guideRecommendations = [];
    let photoPath = '';
    if (photo && typeof photo === 'string' && photo.startsWith('data:')) {
      try {
        const m = photo.match(/^data:image\/[a-z]+;base64,(.+)$/);
        if (m) {
          const buf = Buffer.from(m[1], 'base64');
          const filename = `guide_${Date.now()}.jpg`;
          fs.writeFileSync(path.join(UPLOADS_DIR, filename), buf);
          photoPath = `/uploads/${filename}`;
        }
      } catch {}
    }
    db.guideRecommendations.push({
      id: 'gr_' + Date.now(),
      categoryId, mode, name, phone, languages, whatsapp, facebook, website, note,
      photo: photoPath,
      createdAt: new Date().toISOString(),
      approved: false,
    });
    writeDB(db);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Look up & delete user submissions by phone ───────────────
app.get('/api/guide-recommend/by-phone', (req, res) => {
  const phone = String(req.query.phone || '').replace(/[^\d+]/g, '');
  if (!phone) return res.status(400).json({ error: 'phone required' });
  const db = readDB();
  const list = (db.guideRecommendations || []).filter(r => (r.phone || '').replace(/[^\d+]/g, '') === phone);
  res.json({ items: list });
});

app.delete('/api/guide-recommend/:id', (req, res) => {
  const id = req.params.id;
  const phone = String(req.body?.phone || req.query.phone || '').replace(/[^\d+]/g, '');
  if (!id || !phone) return res.status(400).json({ error: 'id+phone required' });
  const db = readDB();
  const list = db.guideRecommendations || [];
  const idx = list.findIndex(r => r.id === id && (r.phone || '').replace(/[^\d+]/g, '') === phone);
  if (idx < 0) return res.status(404).json({ error: 'not found or phone mismatch' });
  list.splice(idx, 1);
  db.guideRecommendations = list;
  writeDB(db);
  res.json({ success: true });
});

// ─── Admin: bulk populate category from Places search ─────────
app.post('/api/admin/populate-category', async (req, res) => {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(503).json({ error: 'No key' });
  const { categoryId, query, count = 10 } = req.body || {};
  if (!categoryId || !query) return res.status(400).json({ error: 'categoryId + query required' });

  const db = readDB();
  const find = (items) => {
    for (const it of (items || [])) {
      if (it.id === categoryId) return it;
      const r = find(it.children);
      if (r) return r;
    }
    return null;
  };
  const cat = find(db.mainCategories) || find(db.extraCategories);
  if (!cat) return res.status(404).json({ error: 'Category not found' });

  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.websiteUri,places.rating,places.userRatingCount,places.photos,places.photos.authorAttributions',
      },
      body: JSON.stringify({ textQuery: query, languageCode: 'he', maxResultCount: Math.min(20, Number(count) * 2) }),
    });
    if (!r.ok) return res.status(r.status).json({ error: `Upstream ${r.status}` });
    const data = await r.json();
    const places = (data.places || []).slice(0, Number(count));
    if (!places.length) return res.json({ added: 0, places: [] });

    const existing = new Set((cat.hotels || []).map(h => (h.titleEn || h.title || '').toLowerCase()));
    const added = [];
    let nextNum = (cat.hotels || []).length + 1;
    for (const p of places) {
      const name = p.displayName?.text || '';
      if (!name || existing.has(name.toLowerCase())) continue;
      // Download photo
      let imagePath = '';
      try {
        const photoName = p.photos?.[0]?.name;
        if (photoName) {
          const photoUrl = placePhotoUrl(photoName, 800);
          const ir = await fetch(photoUrl);
          if (ir.ok) {
            const buf = Buffer.from(await ir.arrayBuffer());
            const filename = `${categoryId}_${nextNum}_${Date.now()}.jpg`;
            fs.writeFileSync(path.join(UPLOADS_DIR, filename), buf);
            imagePath = `/uploads/${filename}`;
          }
        }
      } catch {}
      const lat = p.location?.latitude;
      const lng = p.location?.longitude;
      const attr = p.photos?.[0]?.authorAttributions?.[0];
      const item = {
        id: `${categoryId}_${nextNum}`,
        title: name,
        titleEn: name,
        text: p.formattedAddress || '',
        image: imagePath,
        pageUrl: p.websiteUri || '',
        mapUrl: p.googleMapsUri || (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : ''),
        coords: lat && lng ? { lat, lng } : undefined,
        photoAttribution: attr?.displayName ? { name: attr.displayName, uri: attr.uri || '' } : undefined,
        visible: true,
      };
      cat.hotels = cat.hotels || [];
      cat.hotels.push(item);
      existing.add(name.toLowerCase());
      added.push({ id: item.id, title: name, image: imagePath });
      nextNum++;
    }
    writeDB(db);
    res.json({ category: cat.title, added: added.length, items: added });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Diagnostic: check DATA_DIR mount ─────────────────────────
app.get('/api/admin/diag', (req, res) => {
  try {
    const exists = fs.existsSync(DATA_DIR);
    const files = exists ? fs.readdirSync(DATA_DIR) : [];
    const stat = exists ? fs.statSync(DATA_DIR) : null;
    res.json({
      DATA_DIR,
      __dirname,
      exists,
      isDirectory: stat?.isDirectory() || false,
      files,
      dbPathExists: fs.existsSync(DB_PATH),
      env_DATA_DIR: process.env.DATA_DIR || null,
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ─── Real-estate news proxy (Google News RSS) ─────────────────
const RE_NEWS_CACHE_MS = 30 * 60 * 1000;
let reNewsCache = null;
app.get('/api/realestate-news', async (_req, res) => {
  try {
    if (reNewsCache && Date.now() - reNewsCache.at < RE_NEWS_CACHE_MS) {
      return res.json(reNewsCache.data);
    }
    const rssUrl = 'https://news.google.com/rss/search?q=' + encodeURIComponent('בטומי נדלן') + '&hl=he&gl=IL&ceid=IL:he';
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);
    const r = await fetch(apiUrl);
    const j = await r.json();
    const filtered = (j.items || []).filter((it) => {
      const text = ((it.title || '') + ' ' + (it.description || '')).toLowerCase();
      return text.includes('בטומי') || text.includes('batumi');
    });
    const FALLBACKS = [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1582407947092-45795aba4166?w=800&q=80',
    ];
    const items = filtered.slice(0, 12).map((it, i) => ({
      id: 'rss_' + i + '_' + (it.guid || it.link || '').slice(-12),
      title: it.title || '',
      summary: (it.description || '').replace(/<[^>]+>/g, '').slice(0, 250),
      image: it.enclosure?.link || it.thumbnail || FALLBACKS[i % FALLBACKS.length],
      link: it.link || '',
      date: it.pubDate ? new Date(it.pubDate).toLocaleDateString('he-IL') : '',
    }));
    const payload = { items };
    reNewsCache = { at: Date.now(), data: payload };
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: e.message, items: [] });
  }
});

// ─── Static Map proxy (multi-pin via Google Static Maps) ─────
app.get('/api/static-map', async (req, res) => {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(503).send('No key');
  const points = String(req.query.points || '').trim();
  const w = Math.min(640, Math.max(80, Number(req.query.w) || 600));
  const h = Math.min(640, Math.max(80, Number(req.query.h) || 240));
  const color = String(req.query.color || 'red').replace(/[^a-zA-Z0-9#]/g, '');
  if (!points) return res.status(400).send('No points');
  const markers = points.split(';').filter(Boolean).map(p => p.trim()).join('|');
  const url = `https://maps.googleapis.com/maps/api/staticmap?size=${w}x${h}&scale=2&markers=color:${encodeURIComponent(color)}|${encodeURIComponent(markers)}&key=${key}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).send('Upstream');
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const buf = await r.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch (e) {
    res.status(500).send('Map error');
  }
});

// ─── Interactive Map HTML (Google Maps JS API, multi-pin) ────
app.get('/api/map-html', (req, res) => {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(503).send('No key');
  const points = String(req.query.points || '').trim();
  if (!points) return res.status(400).send('No points');
  const color = String(req.query.color || '#1A6B8A').replace(/[^a-zA-Z0-9#]/g, '');
  const pts = points.split(';').filter(Boolean).map(p => {
    const [lat, lng, ...nameParts] = p.split(',');
    return { lat: parseFloat(lat), lng: parseFloat(lng), name: decodeURIComponent(nameParts.join(',') || '') };
  }).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (pts.length === 0) return res.status(400).send('Bad points');
  const focus = String(req.query.focus || '').trim();
  const focusPoint = focus ? (() => { const [la, ln] = focus.split(','); return { lat: parseFloat(la), lng: parseFloat(ln) }; })() : null;
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#m{margin:0;padding:0;height:100%;width:100%;}.gm-style-iw{direction:rtl;font-family:-apple-system,sans-serif;}</style></head><body><div id="m"></div><script>const PTS=${JSON.stringify(pts)};const COLOR=${JSON.stringify(color)};const FOCUS=${JSON.stringify(focusPoint)};function init(){const map=new google.maps.Map(document.getElementById('m'),{center:FOCUS||{lat:PTS[0].lat,lng:PTS[0].lng},zoom:FOCUS?16:12,mapTypeControl:false,streetViewControl:false,fullscreenControl:false});const bounds=new google.maps.LatLngBounds();PTS.forEach((p,i)=>{const pos={lat:p.lat,lng:p.lng};bounds.extend(pos);const isFocus=FOCUS&&Math.abs(FOCUS.lat-p.lat)<0.0001&&Math.abs(FOCUS.lng-p.lng)<0.0001;const m=new google.maps.Marker({position:pos,map,title:p.name||'',icon:{path:google.maps.SymbolPath.CIRCLE,scale:isFocus?15:11,fillColor:isFocus?'#e11d48':COLOR,fillOpacity:1,strokeColor:'#fff',strokeWeight:isFocus?3:2}});if(p.name){const iw=new google.maps.InfoWindow({content:'<div style="direction:rtl;"><b>'+p.name+'</b></div>'});m.addListener('click',()=>iw.open({anchor:m,map}));m.addListener('mouseover',()=>iw.open({anchor:m,map}));m.addListener('mouseout',()=>iw.close());if(isFocus)iw.open({anchor:m,map});}});if(PTS.length>1&&!FOCUS)map.fitBounds(bounds,40);}</script><script src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=he&callback=init" async defer></script></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(html);
});

// ─── Ratings ──────────────────────────────────────────────────
app.get('/api/ratings', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.ratings || {} });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/ratings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const score = parseInt(req.body.score, 10);
    if (!id || !score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, error: 'invalid input' });
    }
    const db = readDB();
    if (!db.ratings) db.ratings = {};
    const cur = db.ratings[id] || { sum: 0, count: 0 };
    cur.sum += score;
    cur.count += 1;
    db.ratings[id] = cur;
    writeDB(db);
    res.json({ success: true, data: { sum: cur.sum, count: cur.count, avg: cur.sum / cur.count } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── User Recommendations ────────────────────────────────────
app.get('/api/recommendations', (req, res) => {
  try {
    const db = readDB();
    const approved = (db.recommendations || []).filter(r => r.status === 'approved');
    res.json({ success: true, data: approved });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/recommendations/all', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.recommendations || [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/recommendations', upload.single('file'), (req, res) => {
  try {
    const { text, location, name } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'text required' });
    const db = readDB();
    if (!db.recommendations) db.recommendations = [];
    const rec = {
      id: 'rec_' + Date.now(),
      name: name || 'גולש אנונימי',
      text,
      location: location || '',
      image: req.file ? `/uploads/${req.file.filename}` : null,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    };
    db.recommendations.push(rec);
    writeDB(db);
    res.json({ success: true, data: rec });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/recommendations/:id/approve', (req, res) => {
  try {
    const db = readDB();
    const rec = (db.recommendations || []).find(r => r.id === req.params.id);
    if (!rec) return res.status(404).json({ success: false, error: 'not found' });
    rec.status = 'approved';
    writeDB(db);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/recommendations/:id/reject', (req, res) => {
  try {
    const db = readDB();
    const rec = (db.recommendations || []).find(r => r.id === req.params.id);
    if (!rec) return res.status(404).json({ success: false, error: 'not found' });
    rec.status = 'rejected';
    writeDB(db);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/recommendations/:id', (req, res) => {
  try {
    const db = readDB();
    db.recommendations = (db.recommendations || []).filter(r => r.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Tour Album (user photos) ────────────────────────────────
app.get('/api/tour-album/:tourId', (req, res) => {
  try {
    const db = readDB();
    const photos = (db.tourAlbums?.[req.params.tourId] || []).filter(p => p.status === 'approved');
    res.json({ success: true, data: photos });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/tour-album', (req, res) => {
  try {
    const db = readDB();
    res.json({ success: true, data: db.tourAlbums || {} });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/tour-album/:tourId', upload.single('file'), (req, res) => {
  try {
    const { tourId } = req.params;
    const { name, city } = req.body;
    if (!req.file) return res.status(400).json({ success: false, error: 'image required' });
    const db = readDB();
    if (!db.tourAlbums) db.tourAlbums = {};
    if (!db.tourAlbums[tourId]) db.tourAlbums[tourId] = [];
    const photo = {
      id: 'tp_' + Date.now(),
      name: name || 'גולש',
      city: city || '',
      image: `/uploads/${req.file.filename}`,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    db.tourAlbums[tourId].push(photo);
    // Cap album at 100 approved photos - delete oldest approved when exceeded
    const approved = db.tourAlbums[tourId].filter(p => p.status === 'approved');
    if (approved.length > 100) {
      const oldestApprovedId = approved[0].id;
      db.tourAlbums[tourId] = db.tourAlbums[tourId].filter(p => p.id !== oldestApprovedId);
    }
    writeDB(db);
    res.json({ success: true, data: photo });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/tour-album/:tourId/:photoId/approve', (req, res) => {
  try {
    const db = readDB();
    const photo = (db.tourAlbums?.[req.params.tourId] || []).find(p => p.id === req.params.photoId);
    if (!photo) return res.status(404).json({ success: false });
    photo.status = 'approved';
    writeDB(db);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/tour-album/:tourId/:photoId/reject', (req, res) => {
  try {
    const db = readDB();
    const photo = (db.tourAlbums?.[req.params.tourId] || []).find(p => p.id === req.params.photoId);
    if (!photo) return res.status(404).json({ success: false });
    photo.status = 'rejected';
    writeDB(db);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Auto-sync Google My Maps (daily) ─────────────────────────
const https = require('https');
const { DOMParser } = (() => { try { return require('xmldom'); } catch { return { DOMParser: null }; } })();

async function syncMapData() {
  const KML_URL = 'https://www.google.com/maps/d/kml?mid=1gr51dJM54EabXWSMhPE5f8n2J3-iiyQ&forcekml=1';
  return new Promise((resolve) => {
    https.get(KML_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const layers = [];
          const folderRegex = /<Folder>([\s\S]*?)<\/Folder>/g;
          let folderMatch;
          while ((folderMatch = folderRegex.exec(data)) !== null) {
            const folderContent = folderMatch[1];
            const nameMatch = folderContent.match(/<name>(.*?)<\/name>/);
            const fname = nameMatch ? nameMatch[1].trim() : 'unknown';
            const points = [];
            const pmRegex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
            let pmMatch;
            while ((pmMatch = pmRegex.exec(folderContent)) !== null) {
              const pm = pmMatch[1];
              const pnameMatch = pm.match(/<name>([\s\S]*?)<\/name>/);
              const coordsMatch = pm.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
              const descMatch = pm.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
              if (pnameMatch && coordsMatch) {
                const c = coordsMatch[1].trim().split(',');
                const cleanName = pnameMatch[1].replace(/[\u200E\u200F]/g, '').replace(/\s+/g, ' ').trim();
                points.push({
                  name: cleanName,
                  lat: parseFloat(c[1]),
                  lng: parseFloat(c[0]),
                  description: descMatch ? descMatch[1].trim() : '',
                });
              }
            }
            if (points.length > 0) layers.push({ name: fname, points });
          }
          if (layers.length > 0) {
            const db = readDB();
            const oldLayers = db.mapLayers || [];
            if (!db.mapLayersBackup) db.mapLayersBackup = {};
            const ts = new Date().toISOString();
            for (const ol of oldLayers) {
              if (!Array.isArray(ol.points) || ol.points.length === 0) continue;
              const arr = db.mapLayersBackup[ol.name] || [];
              arr.unshift({ timestamp: ts, points: ol.points, color: ol.color || '' });
              db.mapLayersBackup[ol.name] = arr.slice(0, 5);
            }
            for (const nl of layers) {
              const old = oldLayers.find(o => o.name === nl.name);
              if (old && old.color) nl.color = old.color;
            }
            db.mapLayers = layers;
            writeDB(db);
            console.log(`🗺️ Map synced: ${layers.length} layers, ${layers.reduce((s,l) => s + l.points.length, 0)} points (backup kept)`);
          }
          resolve(true);
        } catch (e) {
          console.error('Map sync error:', e.message);
          resolve(false);
        }
      });
    }).on('error', (e) => { console.error('Map fetch error:', e.message); resolve(false); });
  });
}

// Sync on startup + every 24 hours
syncMapData();
setInterval(syncMapData, 24 * 60 * 60 * 1000);

// Manual sync endpoint
app.get('/api/sync-map', async (req, res) => {
  await syncMapData();
  const db = readDB();
  const layers = db.mapLayers || [];
  res.json({ success: true, layers: layers.length, points: layers.reduce((s, l) => s + l.points.length, 0) });
});

// GET /api/map-backups — list all layer backups with metadata
app.get('/api/map-backups', (req, res) => {
  const db = readDB();
  const backups = db.mapLayersBackup || {};
  const current = db.mapLayers || [];
  const out = {};
  for (const [layerName, versions] of Object.entries(backups)) {
    out[layerName] = (versions || []).map(v => ({
      timestamp: v.timestamp,
      pointsCount: Array.isArray(v.points) ? v.points.length : 0,
    }));
  }
  const currentSummary = current.map(l => ({ name: l.name, pointsCount: (l.points || []).length }));
  res.json({ success: true, backups: out, current: currentSummary });
});

// POST /api/map-backups/restore — body: { layerName, timestamp }
app.post('/api/map-backups/restore', (req, res) => {
  const { layerName, timestamp } = req.body || {};
  if (!layerName || !timestamp) return res.status(400).json({ success: false, error: 'layerName and timestamp required' });
  const db = readDB();
  const versions = (db.mapLayersBackup || {})[layerName] || [];
  const snap = versions.find(v => v.timestamp === timestamp);
  if (!snap) return res.status(404).json({ success: false, error: 'backup not found' });
  if (!Array.isArray(db.mapLayers)) db.mapLayers = [];
  const idx = db.mapLayers.findIndex(l => l.name === layerName);
  const restored = { name: layerName, points: snap.points, color: snap.color || '' };
  if (idx >= 0) db.mapLayers[idx] = { ...db.mapLayers[idx], ...restored };
  else db.mapLayers.push(restored);
  writeDB(db);
  res.json({ success: true, restored: { layerName, timestamp, pointsCount: snap.points.length } });
});

// DELETE /api/map-backups/:layerName/:timestamp
app.delete('/api/map-backups/:layerName/:timestamp', (req, res) => {
  const { layerName, timestamp } = req.params;
  const db = readDB();
  if (!db.mapLayersBackup || !db.mapLayersBackup[layerName]) return res.status(404).json({ success: false });
  const before = db.mapLayersBackup[layerName].length;
  db.mapLayersBackup[layerName] = db.mapLayersBackup[layerName].filter(v => v.timestamp !== timestamp);
  if (db.mapLayersBackup[layerName].length === 0) delete db.mapLayersBackup[layerName];
  writeDB(db);
  res.json({ success: true, deleted: before - (db.mapLayersBackup[layerName]?.length || 0) });
});

// ─── Resolve URL (follow redirects) — for Google News links ───
app.get('/api/resolve-url', async (req, res) => {
  const url = String(req.query.url || '');
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ success: false, error: 'invalid url' });
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    let resolved = r.url;
    // Google News may inject the actual article URL via meta refresh / link tag
    if (resolved.includes('news.google.com')) {
      const html = await r.text();
      const m = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*data-n-au/i)
            || html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^;]+;\s*url=([^"']+)["']/i);
      if (m && m[1]) resolved = m[1];
    }
    res.json({ success: true, url: resolved });
  } catch {
    res.json({ success: false, url });
  }
});

// ─── OG image scraper (cache 24h) ─────────────────────────────
const ogCache = new Map();
async function resolveGoogleNews(url) {
  if (!/news\.google\.com/i.test(url)) return url;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    let resolved = r.url;
    if (resolved.includes('news.google.com')) {
      const html = await r.text();
      const m = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*data-n-au/i)
            || html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^;]+;\s*url=([^"']+)["']/i)
            || html.match(/data-url=["'](https?:\/\/[^"']+)["']/i);
      if (m && m[1]) resolved = m[1].replace(/&amp;/g, '&');
    }
    return resolved;
  } catch { return url; }
}

app.get('/api/og-image', async (req, res) => {
  const url = String(req.query.url || '');
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ success: false, error: 'invalid url' });
  const cached = ogCache.get(url);
  if (cached && Date.now() - cached.fetchedAt < 24 * 60 * 60 * 1000) {
    return res.json({ success: true, image: cached.image, cached: true });
  }
  try {
    const realUrl = await resolveGoogleNews(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(realUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'he,en;q=0.9',
      },
      signal: ctrl.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    const html = await r.text();
    const m1 = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const m2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const m3 = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    const m4 = html.match(/<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i);
    let image = (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]) || (m4 && m4[1]) || '';
    if (!image) {
      const img = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpe?g|png|webp))["'][^>]*>/i);
      if (img && img[1]) image = img[1];
    }
    ogCache.set(url, { image, fetchedAt: Date.now() });
    res.json({ success: true, image, resolved: realUrl !== url ? realUrl : undefined });
  } catch {
    res.json({ success: false, error: 'fetch failed' });
  }
});

// ─── Listings folder uploads ──────────────────────────────────

function syncRealEstateGalleryFromFolder() {
  try {
    const files = fs.readdirSync(LISTINGS_DIR)
      .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .sort()
      .reverse();
    const slides = files.map((f, i) => ({
      id: 'gs_listing_' + i,
      uri: `/uploads/${encodeURIComponent('מודעות-נדלן')}/${encodeURIComponent(f)}`,
      caption: 'נדל״ן בבטומי',
    }));
    const db = readDB();
    db.realEstateGallery = slides;
    writeDB(db);
  } catch {}
}

// POST /api/upload-listing — saves photo to /uploads/מודעות-נדלן/
app.post('/api/upload-listing', listingsUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'no file' });
  syncRealEstateGalleryFromFolder();
  res.json({
    success: true,
    filename: req.file.filename,
    url: `/uploads/${encodeURIComponent('מודעות-נדלן')}/${encodeURIComponent(req.file.filename)}`,
  });
});

// POST /api/sync-listings-gallery — manual resync trigger
app.post('/api/sync-listings-gallery', (_req, res) => {
  syncRealEstateGalleryFromFolder();
  res.json({ success: true });
});

// POST /api/migrate-listings-images — one-time migration of existing listing images
app.post('/api/migrate-listings-images', (_req, res) => {
  try {
    const db = readDB();
    const all = db.listings || [];
    let copied = 0; let skipped = 0;
    const FALLBACK_UPLOADS = path.join(__dirname, 'uploads');
    for (const l of all) {
      for (const img of (l.images || [])) {
        const filename = path.basename(String(img));
        const dst = path.join(LISTINGS_DIR, filename);
        if (fs.existsSync(dst)) { skipped++; continue; }
        const src1 = path.join(UPLOADS_DIR, filename);
        const src2 = path.join(FALLBACK_UPLOADS, filename);
        const src = fs.existsSync(src1) ? src1 : (fs.existsSync(src2) ? src2 : null);
        if (src) {
          fs.copyFileSync(src, dst);
          copied++;
        }
      }
    }
    res.json({ success: true, copied, skipped });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

// GET /api/listings-images — returns array of public URLs
app.get('/api/listings-images', (_req, res) => {
  try {
    const files = fs.readdirSync(LISTINGS_DIR)
      .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .sort()
      .reverse();
    const images = files.map(f => `/uploads/${encodeURIComponent('מודעות-נדלן')}/${encodeURIComponent(f)}`);
    res.json({ success: true, images });
  } catch (e) {
    res.json({ success: false, images: [], error: 'failed to read folder' });
  }
});

// ─── Listings (user-submitted real-estate ads) ────────────────

// GET /api/listings — public list (approved + visible)
app.get('/api/listings', (req, res) => {
  const db = readDB();
  const all = db.listings || [];
  const type = req.query.type;
  const publicOnly = req.query.all !== '1';
  let rows = all;
  if (publicOnly) rows = rows.filter(l => l.approved && l.visible !== false);
  if (type) rows = rows.filter(l => l.type === type);
  rows = rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, listings: rows });
});

// POST /api/listings — submit new listing
app.post('/api/listings', (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.type || !body.phone) {
    return res.status(400).json({ success: false, error: 'title, type, phone required' });
  }
  const db = readDB();
  if (!db.listings) db.listings = [];
  const rec = {
    id: 'lst_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: body.type,
    title: String(body.title).slice(0, 120),
    description: String(body.description || '').slice(0, 1000),
    price: body.price || '',
    location: body.location || '',
    phone: normalizePhone(body.phone),
    images: Array.isArray(body.images) ? body.images.slice(0, 8) : [],
    video: body.video || '',
    deviceId: body.deviceId || '',
    size: body.size || 'half',
    period: body.period || '',
    highlightStyle: body.highlightStyle || '',
    createdAt: new Date().toISOString(),
    approved: false,
    visible: true,
  };
  db.listings.push(rec);
  writeDB(db);
  res.json({ success: true, listing: rec });
});

// GET /api/listings/mine?deviceId=X or ?phone=X — returns user's own listings
app.get('/api/listings/mine', (req, res) => {
  const db = readDB();
  const { deviceId, phone } = req.query;
  if (!deviceId && !phone) return res.status(400).json({ success: false, error: 'deviceId or phone required' });
  const normalized = phone ? normalizePhone(String(phone)) : '';
  const rows = (db.listings || []).filter(l =>
    (deviceId && l.deviceId === deviceId) || (normalized && l.phone === normalized)
  ).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, listings: rows });
});

// PUT /api/listings/:id — update (admin approve / edit)
app.put('/api/listings/:id', (req, res) => {
  const db = readDB();
  const i = (db.listings || []).findIndex(l => l.id === req.params.id);
  if (i < 0) return res.status(404).json({ success: false, error: 'not found' });
  db.listings[i] = { ...db.listings[i], ...req.body };
  writeDB(db);
  res.json({ success: true, listing: db.listings[i] });
});

function deleteListingFiles(listing) {
  if (!listing || !listing.images) return;
  for (const img of listing.images) {
    try {
      const filename = path.basename(decodeURIComponent(String(img)));
      const p = path.join(LISTINGS_DIR, filename);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {}
  }
  if (listing.video) {
    try {
      const filename = path.basename(decodeURIComponent(String(listing.video)));
      const p = path.join(LISTINGS_DIR, filename);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {}
  }
}

// DELETE /api/listings/:id — admin (legacy, no body)
app.delete('/api/listings/:id', (req, res) => {
  const db = readDB();
  const item = (db.listings || []).find(l => l.id === req.params.id);
  const before = (db.listings || []).length;
  db.listings = (db.listings || []).filter(l => l.id !== req.params.id);
  writeDB(db);
  if (item) deleteListingFiles(item);
  syncRealEstateGalleryFromFolder();
  res.json({ success: true, deleted: before - db.listings.length });
});

// POST /api/listings/:id/owner-delete — owner-side delete (requires deviceId or phone match)
app.post('/api/listings/:id/owner-delete', (req, res) => {
  const db = readDB();
  const item = (db.listings || []).find(l => l.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'not found' });
  const { deviceId, phone } = req.body || {};
  const ownerByDevice = deviceId && deviceId === item.deviceId;
  const ownerByPhone = phone && normalizePhone(phone) === item.phone;
  if (!ownerByDevice && !ownerByPhone) {
    return res.status(403).json({ success: false, error: 'verification failed' });
  }
  db.listings = db.listings.filter(l => l.id !== req.params.id);
  writeDB(db);
  deleteListingFiles(item);
  syncRealEstateGalleryFromFolder();
  res.json({ success: true });
});

// ─── Developers (mini-portals for real-estate builders) ────────

// GET /api/developers — public list (approved + visible)
app.get('/api/developers', (req, res) => {
  const db = readDB();
  const all = db.developers || [];
  const publicOnly = req.query.all !== '1';
  let rows = all;
  if (publicOnly) rows = rows.filter(d => d.approved && d.visible !== false);
  rows = rows.sort((a, b) => {
    const pa = a.package === 'premium' ? 0 : 1;
    const pb = b.package === 'premium' ? 0 : 1;
    if (pa !== pb) return pa - pb;
    const ba = a.bumpUntil && new Date(a.bumpUntil) > new Date() ? 0 : 1;
    const bb = b.bumpUntil && new Date(b.bumpUntil) > new Date() ? 0 : 1;
    if (ba !== bb) return ba - bb;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
  res.json({ success: true, developers: rows });
});

// POST /api/developers — submit new developer
app.post('/api/developers', (req, res) => {
  const body = req.body || {};
  if (!body.company || !body.projectName || !body.phone || !body.package) {
    return res.status(400).json({ success: false, error: 'company, projectName, phone, package required' });
  }
  const maxUnits = body.package === 'premium' ? 10 : 5;
  const db = readDB();
  if (!db.developers) db.developers = [];
  const rec = {
    id: 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    package: body.package === 'premium' ? 'premium' : 'basic',
    company: String(body.company).slice(0, 80),
    projectName: String(body.projectName).slice(0, 120),
    logo: body.logo || '',
    brandColor: body.brandColor || '',
    location: body.location || '',
    deliveryDate: body.deliveryDate || '',
    description: String(body.description || '').slice(0, 1000),
    phone: normalizePhone(body.phone),
    whatsapp: body.whatsapp ? normalizePhone(body.whatsapp) : '',
    website: body.website || '',
    units: Array.isArray(body.units) ? body.units.slice(0, maxUnits).map(u => ({
      id: u.id || 'u_' + Math.random().toString(36).slice(2, 8),
      title: String(u.title || '').slice(0, 80),
      image: u.image || '',
      price: u.price || '',
      size: u.size || '',
      description: String(u.description || '').slice(0, 500),
      images: Array.isArray(u.images) ? u.images.slice(0, 8) : [],
    })) : [],
    createdAt: new Date().toISOString(),
    approved: false,
    visible: true,
    bumpUntil: '',
  };
  db.developers.push(rec);
  writeDB(db);
  res.json({ success: true, developer: rec });
});

// PUT /api/developers/:id — admin approve / edit
app.put('/api/developers/:id', (req, res) => {
  const db = readDB();
  const i = (db.developers || []).findIndex(d => d.id === req.params.id);
  if (i < 0) return res.status(404).json({ success: false, error: 'not found' });
  db.developers[i] = { ...db.developers[i], ...req.body };
  writeDB(db);
  res.json({ success: true, developer: db.developers[i] });
});

// DELETE /api/developers/:id
app.delete('/api/developers/:id', (req, res) => {
  const db = readDB();
  const before = (db.developers || []).length;
  db.developers = (db.developers || []).filter(d => d.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, deleted: before - db.developers.length });
});

// ─── Subscribers (phone-based access) ─────────────────────────

function normalizePhone(p) {
  return String(p || '').replace(/\D/g, '');
}

function computeExpiry(plan, startDate) {
  const start = startDate ? new Date(startDate) : new Date();
  const d = new Date(start);
  if (plan === 'year') d.setFullYear(d.getFullYear() + 1);
  else d.setDate(d.getDate() + 30); // default 30d
  return d.toISOString();
}

// GET /api/subscribers — list all
app.get('/api/subscribers', (req, res) => {
  const db = readDB();
  res.json({ success: true, subscribers: db.subscribers || [] });
});

// GET /api/subscribers/check?phone=... — check active status
app.get('/api/subscribers/check', (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (!phone) return res.json({ success: false, active: false, error: 'missing phone' });
  const db = readDB();
  const sub = (db.subscribers || []).find(s => normalizePhone(s.phone) === phone);
  if (!sub) return res.json({ success: true, active: false, found: false });
  const now = new Date();
  const exp = new Date(sub.expiresAt);
  const active = sub.active !== false && exp > now;
  res.json({ success: true, active, found: true, subscriber: sub });
});

// POST /api/subscribers — add (or extend if exists)
app.post('/api/subscribers', (req, res) => {
  const { phone, name, plan, startDate } = req.body || {};
  const p = normalizePhone(phone);
  if (!p) return res.status(400).json({ success: false, error: 'phone required' });
  const db = readDB();
  if (!db.subscribers) db.subscribers = [];
  const existingIdx = db.subscribers.findIndex(s => normalizePhone(s.phone) === p);
  const start = startDate || new Date().toISOString();
  const expiresAt = computeExpiry(plan || '30d', start);
  const record = { phone: p, name: name || '', plan: plan || '30d', startDate: start, expiresAt, active: true };
  if (existingIdx >= 0) db.subscribers[existingIdx] = record;
  else db.subscribers.push(record);
  writeDB(db);
  res.json({ success: true, subscriber: record });
});

// PUT /api/subscribers/:phone — update fields
app.put('/api/subscribers/:phone', (req, res) => {
  const p = normalizePhone(req.params.phone);
  const db = readDB();
  const i = (db.subscribers || []).findIndex(s => normalizePhone(s.phone) === p);
  if (i < 0) return res.status(404).json({ success: false, error: 'not found' });
  const body = req.body || {};
  const current = db.subscribers[i];
  const plan = body.plan || current.plan;
  const startDate = body.startDate || current.startDate;
  const updated = {
    ...current,
    ...body,
    phone: p,
    plan,
    startDate,
    expiresAt: body.expiresAt || computeExpiry(plan, startDate),
  };
  db.subscribers[i] = updated;
  writeDB(db);
  res.json({ success: true, subscriber: updated });
});

// DELETE /api/subscribers/:phone
app.delete('/api/subscribers/:phone', (req, res) => {
  const p = normalizePhone(req.params.phone);
  const db = readDB();
  const before = (db.subscribers || []).length;
  db.subscribers = (db.subscribers || []).filter(s => normalizePhone(s.phone) !== p);
  writeDB(db);
  res.json({ success: true, deleted: before - db.subscribers.length });
});

// ─── Public classifieds board (marketplace יד2 + real-estate buy/sell/rent) ──
// NOTE: stored under `boardAds` — deliberately SEPARATE from `listings`
// (which is the admin real-estate portal). Free ads go live immediately for
// everyone. `featuredUntil` is set ONLY by a confirmed $20 PayPal payment
// (capture/webhook below) — the client can never feature itself for free.
const PAYPAL_ENV = (process.env.PAYPAL_ENV || 'live').toLowerCase();
const PAYPAL_BASE = PAYPAL_ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
const FEATURED_PRICE = '20.00';
const FEATURED_DAYS = 90;
// Manual fallback used until PayPal REST credentials are configured on the server.
const FEATURED_FALLBACK_LINK = 'https://www.paypal.com/ncp/payment/K9845EKL6GPCY';

function getBoard(db) { return Array.isArray(db.boardAds) ? db.boardAds : []; }
function withFeatured(x) { return { ...x, featured: !!(x.featuredUntil && new Date(x.featuredUntil).getTime() > Date.now()) }; }

async function paypalToken() {
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_SECRET;
  if (!id || !secret) return null;
  try {
    const r = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    const j = await r.json();
    return j.access_token || null;
  } catch { return null; }
}

function serverBase(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function markFeatured(adId) {
  const db = readDB();
  const list = getBoard(db);
  const it = list.find(x => x.id === adId);
  if (!it) return false;
  it.featuredUntil = new Date(Date.now() + FEATURED_DAYS * 86400000).toISOString();
  it.paidAt = new Date().toISOString();
  db.boardAds = list;
  writeDB(db);
  return true;
}

// GET /api/board?board=market|realestate  — public list (featured first)
app.get('/api/board', (req, res) => {
  try {
    const db = readDB();
    const board = req.query.board;
    let list = getBoard(db).map(withFeatured);
    if (board) list = list.filter(x => x.board === board);
    list.sort((a, b) => (Number(b.featured) - Number(a.featured)) || String(b.createdAt).localeCompare(String(a.createdAt)));
    res.json({ success: true, data: list });
  } catch (e) { res.status(500).json({ success: false, error: 'read error' }); }
});

// POST /api/board  — create a free ad (goes live immediately)
app.post('/api/board', (req, res) => {
  try {
    const b = req.body || {};
    if (!b.board || !String(b.title || '').trim() || !String(b.phone || '').trim())
      return res.status(400).json({ success: false, error: 'board, title, phone required' });
    const db = readDB();
    const list = getBoard(db);
    const item = {
      id: `ad_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      board: String(b.board),                 // 'market' | 'realestate'
      mode: b.mode || null,                    // realestate: 'sale' | 'rent'
      title: String(b.title).trim(),
      description: String(b.description || '').trim(),
      price: String(b.price || '').trim(),
      phone: String(b.phone).trim(),
      images: Array.isArray(b.images) ? b.images.slice(0, 6) : [],
      video: b.video || null,
      hl: b.hl || 'none',                      // requested highlight; applies only while featured
      featuredUntil: null,                     // set only by paid capture/webhook
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    db.boardAds = list;
    writeDB(db);
    res.json({ success: true, data: withFeatured(item) });
  } catch (e) { res.status(500).json({ success: false, error: 'write error' }); }
});

// PUT /api/board/:id  — edit own ad (phone must match)
app.put('/api/board/:id', (req, res) => {
  try {
    const db = readDB();
    const list = getBoard(db);
    const it = list.find(x => x.id === req.params.id);
    if (!it) return res.status(404).json({ success: false, error: 'not found' });
    const b = req.body || {};
    if (String(b.phone || '').trim() !== it.phone) return res.status(403).json({ success: false, error: 'phone mismatch' });
    if (b.title !== undefined) it.title = String(b.title).trim();
    if (b.description !== undefined) it.description = String(b.description).trim();
    if (b.price !== undefined) it.price = String(b.price).trim();
    if (b.mode !== undefined) it.mode = b.mode;
    if (b.hl !== undefined) it.hl = b.hl;
    if (Array.isArray(b.images)) it.images = b.images.slice(0, 6);
    if (b.video !== undefined) it.video = b.video || null;
    db.boardAds = list;
    writeDB(db);
    res.json({ success: true, data: withFeatured(it) });
  } catch (e) { res.status(500).json({ success: false, error: 'write error' }); }
});

// DELETE /api/board/:id?phone=...  — delete own ad
app.delete('/api/board/:id', (req, res) => {
  try {
    const phone = String((req.query.phone || (req.body && req.body.phone) || '')).trim();
    const db = readDB();
    const list = getBoard(db);
    const it = list.find(x => x.id === req.params.id);
    if (!it) return res.json({ success: true });
    if (phone !== it.phone) return res.status(403).json({ success: false, error: 'phone mismatch' });
    db.boardAds = list.filter(x => x.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: 'write error' }); }
});

// POST /api/board/pay {adId}  — start a $20 featured payment for an ad.
// Returns an approve URL (auto) if PayPal REST creds are set, else the manual link.
app.post('/api/board/pay', async (req, res) => {
  try {
    const adId = String((req.body && req.body.adId) || '').trim();
    if (!adId) return res.status(400).json({ success: false, error: 'adId required' });
    const db = readDB();
    if (!getBoard(db).find(x => x.id === adId)) return res.status(404).json({ success: false, error: 'ad not found' });
    const token = await paypalToken();
    if (!token) return res.json({ success: true, mode: 'manual', url: FEATURED_FALLBACK_LINK });
    const base = serverBase(req);
    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ custom_id: adId, description: 'Featured Listing · 90 Days', amount: { currency_code: 'USD', value: FEATURED_PRICE } }],
        application_context: {
          brand_name: 'Batumi Online',
          user_action: 'PAY_NOW',
          return_url: `${base}/api/board/return?ad=${encodeURIComponent(adId)}`,
          cancel_url: `${base}/api/board/cancel`,
        },
      }),
    });
    const order = await orderRes.json();
    const approve = (order.links || []).find(l => l.rel === 'approve');
    if (!approve) return res.status(502).json({ success: false, error: 'paypal order failed' });
    res.json({ success: true, mode: 'auto', url: approve.href, orderId: order.id });
  } catch (e) { res.status(500).json({ success: false, error: String((e && e.message) || e) }); }
});

// GET /api/board/return  — PayPal redirect after approval: capture + feature the ad
app.get('/api/board/return', async (req, res) => {
  const adId = String(req.query.ad || '');
  const orderId = String(req.query.token || '');
  let ok = false;
  try {
    const tok = await paypalToken();
    if (tok && orderId) {
      const capRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      });
      const cap = await capRes.json();
      if (cap.status === 'COMPLETED') ok = markFeatured(adId);
    }
  } catch (e) { console.warn('board capture error', e); }
  res.set('Content-Type', 'text/html; charset=utf-8');
  const mark = ok ? '✓' : '…';
  const head = ok ? 'התשלום התקבל' : 'מעבד את התשלום';
  const sub = ok ? 'המודעה שלך מודגשת ל-90 יום. אפשר לחזור לאפליקציה.' : 'אם שילמת, ההדגשה תופיע בעוד רגע. אפשר לחזור לאפליקציה.';
  res.send(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${head}</title><style>body{font-family:-apple-system,Segoe UI,Arial;background:#F5F1EA;color:#16222c;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;text-align:center;padding:24px}.c{max-width:340px}.m{font-size:64px;color:#2E9E6B;line-height:1}h1{font-size:22px;margin:14px 0 6px}p{color:#7a7261;font-size:15px}</style></head><body><div class="c"><div class="m">${mark}</div><h1>${head}</h1><p>${sub}</p></div></body></html>`);
});

app.get('/api/board/cancel', (_req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>בוטל</title><style>body{font-family:-apple-system,Arial;background:#F5F1EA;color:#16222c;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;text-align:center;padding:24px}</style></head><body><div><h1>התשלום בוטל</h1><p>אפשר לחזור לאפליקציה ולנסות שוב.</p></div></body></html>`);
});

// POST /api/board/webhook  — PayPal webhook backup (if buyer closes the browser)
app.post('/api/board/webhook', async (req, res) => {
  try {
    const event = req.body || {};
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      const tok = await paypalToken();
      const v = tok ? await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
        method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_algo: req.headers['paypal-auth-algo'],
          cert_url: req.headers['paypal-cert-url'],
          transmission_id: req.headers['paypal-transmission-id'],
          transmission_sig: req.headers['paypal-transmission-sig'],
          transmission_time: req.headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: event,
        }),
      }).then(r => r.json()).catch(() => null) : null;
      if (!v || v.verification_status !== 'SUCCESS') return res.status(400).json({ success: false });
    }
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const adId = event.resource && event.resource.custom_id;
      if (adId) markFeatured(adId);
    }
    res.json({ success: true });
  } catch (e) { res.status(200).json({ success: true }); }
});

// ─── Serve Expo web (dev proxy if running, else static dist) ────
const http = require('http');
const WEB_DIST = path.join(__dirname, '..', 'dist');
const DEV_TARGET = 'http://localhost:8081';
let devUp = false;
function pingDev() {
  http.get(DEV_TARGET, (r) => { devUp = r.statusCode === 200; r.resume(); }).on('error', () => { devUp = false; });
}
pingDev();
setInterval(pingDev, 5000);

app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/batumi-images/')) return next();
  if (!devUp) return next();
  const url = DEV_TARGET + req.originalUrl;
  http.get(url, { headers: { ...req.headers, host: 'localhost:8081' } }, (upstream) => {
    res.status(upstream.statusCode || 200);
    Object.entries(upstream.headers || {}).forEach(([k, v]) => { if (v !== undefined) res.setHeader(k, v); });
    upstream.pipe(res);
  }).on('error', () => next());
});

// ─── Batumi AI — closed-domain voice guide over the app's own content ───────
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

function aiStripHtml(t) { return String(t || '').replace(/<[^>]+>/g, ''); }
function aiStripGoogle(t) { return String(t || '').replace(/\s*[^.!?\n]*Google[\s\S]*?\+995[\s\S]*?:[^.\n]*\.?/g, '').trim(); }
function aiFirst(t, n) { t = aiStripGoogle(aiStripHtml(t)).replace(/\s+/g, ' ').trim(); return t.slice(0, n || 140); }

function aiBuildKB(db) {
  const lines = [];
  const walk = (cats) => (cats || []).forEach((c) => {
    const name = c.title;
    (c.children || []).forEach((ch) => (ch.hotels || []).forEach((h) => {
      if (h.visible === false) return;
      const co = h.coords || {};
      const loc = co.lat ? ` @${Number(co.lat).toFixed(4)},${Number(co.lng).toFixed(4)}` : '';
      const pr = h.price ? ` [${h.price}]` : '';
      lines.push(`- id:${h.id || ''} | ${h.title}${h.titleEn ? ` (${h.titleEn})` : ''} | ${name} > ${ch.title}${loc}${pr}: ${aiFirst(h.text)}`);
    }));
    (c.hotels || []).forEach((h) => {
      if (h.visible === false) return;
      const co = h.coords || {};
      const loc = co.lat ? ` @${Number(co.lat).toFixed(4)},${Number(co.lng).toFixed(4)}` : '';
      lines.push(`- id:${h.id || ''} | ${h.title}${h.titleEn ? ` (${h.titleEn})` : ''} | ${name}${loc}: ${aiFirst(h.text)}`);
    });
  });
  walk(db.mainCategories); walk(db.extraCategories);
  const info = (db.infoPortal || []).map((it) => `# ${it.title}: ${aiFirst(it.longText || it.subtitle, 400)}`);
  return lines.join('\n') + '\n\n=== מידע כללי / Info topics ===\n' + info.join('\n');
}

function aiPlaceIndex(db) {
  const byId = {};
  const collect = (cats) => (cats || []).forEach((c) => {
    (c.children || []).forEach((ch) => (ch.hotels || []).forEach((h) => { if (h.id) byId[h.id] = { id: h.id, title: h.title, titleEn: h.titleEn, category: c.title, catId: ch.id }; }));
    (c.hotels || []).forEach((h) => { if (h.id) byId[h.id] = { id: h.id, title: h.title, titleEn: h.titleEn, category: c.title, catId: c.id }; });
  });
  collect(db.mainCategories); collect(db.extraCategories);
  return byId;
}

function anthropicChat(system, userMsg) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ model: AI_MODEL, max_tokens: 600, system, messages: [{ role: 'user', content: userMsg }] });
    const r = https.request({ method: 'POST', hostname: 'api.anthropic.com', path: '/v1/messages', headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } }, (resp) => {
      let d = ''; resp.on('data', (c) => (d += c)); resp.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} resolve({ status: resp.statusCode, json: j, raw: (d || '').slice(0, 200) }); });
    });
    r.on('error', (e) => resolve({ status: 0, json: null, raw: String(e && e.message || e) })); r.write(payload); r.end();
  });
}
function aiExtract(j) { return (j && j.content && Array.isArray(j.content) ? j.content.filter((b) => b && b.type === 'text').map((b) => b.text).join('') : '') || ''; }

app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, lang, coords } = req.body || {};
    if (!question || !String(question).trim()) return res.json({ error: 'empty' });
    if (!ANTHROPIC_KEY) return res.json({ answer: 'המסייע עדיין לא מחובר.', demo: true });
    const db = readDB();
    const kb = aiBuildKB(db);
    const langName = { he: 'Hebrew', en: 'English', fa: 'Persian', ru: 'Russian' }[lang] || "the user's language";
    const loc = coords && coords.lat ? `\nUser's current location: ${coords.lat},${coords.lng} — use it for "near me"/distance questions.` : '';
    const system = `You are "Batumi AI", the in-app voice guide of the Batumionline tourism app (Batumi, Georgia).
Answer ONLY from the APP DATA below. This is a CLOSED assistant: do NOT use outside knowledge and NEVER invent places, prices, phone numbers or facts.
If the answer is not in the app data, briefly say (in ${langName}) that you don't have that in the app, and suggest something related that the app DOES offer.
Reply in ${langName}, 1-3 short spoken sentences (it is read aloud) — warm and concise.
When you recommend specific places, add a FINAL line exactly like: PLACES: id::Name, id::Name (max 3) — where "id" is the place id and "Name" is that place's name written in ${langName}. Never mention this line or the ids in the spoken text.${loc}

=== APP DATA ===
${kb}`;
    let resp = await anthropicChat(system, String(question));
    if ((!resp.json || resp.status >= 429) ) { await new Promise((r) => setTimeout(r, 1500)); resp = await anthropicChat(system, String(question)); }
    const j = resp.json;
    if (!j) return res.json({ error: `no_response status ${resp.status}`, raw: resp.raw });
    if (j.error) return res.json({ error: (j.error.message || j.error.type || 'ai_error'), status: resp.status });
    let txt = aiExtract(j);
    if (!txt) return res.json({ error: 'empty_response', debug: { status: resp.status, stop: j.stop_reason, type: j.type, keys: Object.keys(j || {}) } });
    let pairs = [];
    const m = txt.match(/PLACES:\s*(.+)\s*$/m);
    if (m) {
      pairs = m[1].split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const i = s.indexOf('::'); return i >= 0 ? { id: s.slice(0, i).trim(), name: s.slice(i + 2).trim() } : { id: s.trim(), name: '' }; });
      txt = txt.replace(/PLACES:.*$/m, '').trim();
    }
    const byId = aiPlaceIndex(db);
    const places = pairs.map((p) => { const info = byId[p.id]; return info ? { ...info, name: p.name || info.titleEn || info.title } : null; }).filter(Boolean).slice(0, 3);
    res.json({ answer: txt || '—', places });
  } catch (e) { res.json({ error: String((e && e.message) || e) }); }
});

if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST, {
    setHeaders: (res, filePath) => {
      // HTML never cached. Hashed assets (with hash in filename) cached long; other JS/CSS short
      if (filePath.endsWith('.html')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      } else if (/\.[a-f0-9]{8,}\.(js|css|woff2?|png|jpe?g|webp|svg)$/i.test(filePath)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/\.(js|css)$/i.test(filePath)) {
        res.set('Cache-Control', 'no-cache');
      }
    }
  }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.sendFile(path.join(WEB_DIST, 'index.html'));
  });
}

// ─── Start server ─────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Batumi Online API running on http://localhost:${PORT}`);
  console.log(`📁 Database: ${DB_PATH}`);
  console.log(`📂 Uploads: ${UPLOADS_DIR}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/content          — fetch all content`);
  console.log(`  GET  /api/content/:section  — fetch section`);
  console.log(`  PUT  /api/content          — update all content`);
  console.log(`  PUT  /api/content/:section  — update section`);
  console.log(`  POST /api/upload           — upload file`);
  console.log(`  GET  /api/flights          — flights proxy (AeroDataBox)`);
  if (process.env.AERODATABOX_KEY) console.log(`🛫 AeroDataBox key loaded`);
});
