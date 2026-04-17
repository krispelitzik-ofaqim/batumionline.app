require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

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
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

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
    const end = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 16);
    const url = `https://${host}/flights/airports/icao/${BUS_ICAO}/${fmt(now)}/${fmt(end)}?withLeg=true&direction=Both&withCancelled=true&withCodeshared=true&withCargo=false&withPrivate=false&withLocation=false`;
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
              const pnameMatch = pm.match(/<name>(.*?)<\/name>/);
              const coordsMatch = pm.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
              const descMatch = pm.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
              if (pnameMatch && coordsMatch) {
                const c = coordsMatch[1].trim().split(',');
                points.push({
                  name: pnameMatch[1].trim(),
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
            for (const nl of layers) {
              const old = oldLayers.find(o => o.name === nl.name);
              if (old && old.color) nl.color = old.color;
            }
            db.mapLayers = layers;
            writeDB(db);
            console.log(`🗺️ Map synced: ${layers.length} layers, ${layers.reduce((s,l) => s + l.points.length, 0)} points`);
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
