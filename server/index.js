require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
let Expo = null;
try { Expo = require('expo-server-sdk').Expo; } catch (e) { console.warn('expo-server-sdk not available'); }
const expoClient = Expo ? new Expo() : null;

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const GALLERY_DIR = path.join(UPLOADS_DIR, 'gallery');
if (!fs.existsSync(GALLERY_DIR)) fs.mkdirSync(GALLERY_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) {
  const seed = path.join(__dirname, 'db.json');
  if (fs.existsSync(seed) && seed !== DB_PATH) {
    fs.copyFileSync(seed, DB_PATH);
  } else {
    fs.writeFileSync(DB_PATH, '{}', 'utf-8');
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb', strict: false }));
app.use('/uploads', express.static(UPLOADS_DIR));
// Fallback: serve git-committed uploads when file not found in persistent volume
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    const files = fs.readdirSync(UPLOADS_DIR)
      .filter(f => !f.startsWith('.') && !fs.statSync(path.join(UPLOADS_DIR, f)).isDirectory())
      .map(f => {
        const stat = fs.statSync(path.join(UPLOADS_DIR, f));
        return {
          filename: f,
          originalName: names[f] || '',
          url: `http://localhost:${PORT}/uploads/${f}`,
          size: stat.size,
          mtime: stat.mtimeMs,
          tags: tags[f] || [],
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
    res.json({ success: true, files });
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

// ─── Flights proxy (AeroDataBox via RapidAPI) ────────────────
const BUS_ICAO = 'UGSB'; // Batumi International Airport
const flightsCache = { arrivals: null, departures: null, fetchedAt: 0 };
const CACHE_MS = 10 * 60 * 1000; // 10 minutes

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
    const start = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h lookback for recent landings
    const end = new Date(now.getTime() + 10 * 60 * 60 * 1000);  // 10h ahead (2+10 = 12h window max)
    const fmt = (d) => d.toISOString().slice(0, 16);
    const url = `https://${host}/flights/airports/icao/${BUS_ICAO}/${fmt(start)}/${fmt(end)}?withLeg=true&direction=Both&withCancelled=true&withCodeshared=true&withCargo=false&withPrivate=false&withLocation=false`;
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': host,
      },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream ${response.status}` });
    }
    const data = await response.json();
    flightsCache.arrivals = data.arrivals || [];
    flightsCache.departures = data.departures || [];
    flightsCache.fetchedAt = Date.now();
    res.json({ arrivals: flightsCache.arrivals, departures: flightsCache.departures, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    size: body.size || 'half',
    period: body.period || '',
    createdAt: new Date().toISOString(),
    approved: false,
    visible: true,
  };
  db.listings.push(rec);
  writeDB(db);
  res.json({ success: true, listing: rec });
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

// DELETE /api/listings/:id
app.delete('/api/listings/:id', (req, res) => {
  const db = readDB();
  const before = (db.listings || []).length;
  db.listings = (db.listings || []).filter(l => l.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, deleted: before - db.listings.length });
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

// ─── Serve Expo web build ─────────────────────────────────────
const WEB_DIST = path.join(__dirname, '..', 'dist');
if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
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
