const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'server', 'db.json');
const GYG_PARTNER = 'PE2GLSE3MAO4YDEIXLNOYXMC67BCZ32C';
const gyg = (slug) => `https://www.getyourguide.com/${slug}?partner_id=${GYG_PARTNER}`;

const MAP = {
  // online — with ticket URL
  at_11: { ticketType: 'online', ticketUrl: gyg('batumi-l32542/batumi-argo-cable-car-ride-with-panoramic-views-t1161370/') },
  a1_4:  { ticketType: 'online', ticketUrl: gyg('alphabet-tower-l139746/') },
  a1_8:  { ticketType: 'online', ticketUrl: 'https://tickets.dolphinarium.ge/' },
  a9_1:  { ticketType: 'online', ticketUrl: gyg('batumi-botanical-garden-l161322/') },
  cul_3: { ticketType: 'online', ticketUrl: 'https://biletebi.ge/en/batumis-dramatuli-teatri' },

  // onsite
  a1_2: { ticketType: 'onsite' }, a1_6: { ticketType: 'onsite' }, at_15: { ticketType: 'onsite' },
  at_16: { ticketType: 'onsite' }, at_17: { ticketType: 'onsite' }, a3_1: { ticketType: 'onsite' },
  a3_2: { ticketType: 'onsite' }, a3_5: { ticketType: 'onsite' }, a9_2: { ticketType: 'onsite' },
  a9_3: { ticketType: 'onsite' }, a9_4: { ticketType: 'onsite' }, cul_1: { ticketType: 'onsite' },
  cul_4: { ticketType: 'onsite' }, cul_5: { ticketType: 'onsite' },

  // free
  a1_1: { ticketType: 'free' }, a1_3: { ticketType: 'free' }, a1_5: { ticketType: 'free' },
  a1_7: { ticketType: 'free' }, a1_10: { ticketType: 'free' }, at_13: { ticketType: 'free' },
  at_14: { ticketType: 'free' }, a2_1: { ticketType: 'free' }, a2_2: { ticketType: 'free' },
  a2_3: { ticketType: 'free' }, a2_4: { ticketType: 'free' }, a2_11: { ticketType: 'free' },
  a3_3: { ticketType: 'free' }, a3_4: { ticketType: 'free' }, a9_5: { ticketType: 'free' },
  a9_6: { ticketType: 'free' }, a5_1: { ticketType: 'free' }, a5_3: { ticketType: 'free' },
  a5_4: { ticketType: 'free' }, a6_1: { ticketType: 'free' }, a6_2: { ticketType: 'free' },
  a6_3: { ticketType: 'free' }, cul_2: { ticketType: 'free' },

  // appointment
  a5_2: { ticketType: 'appointment' }, a8_1: { ticketType: 'appointment' },
  nat_fishing: { ticketType: 'appointment' }, nat_birdwatch: { ticketType: 'appointment' },

  // skip
  a9_7: { ticketType: 'skip' }, a9_8: { ticketType: 'skip' },
  a9_9: { ticketType: 'skip' }, a9_10: { ticketType: 'skip' },
};

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const att = db.mainCategories.find(c => c.id === '2');

let updated = 0, missing = [];
const applied = new Set();

const walk = (items) => {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (item && typeof item === 'object') {
      if (item.id && MAP[item.id]) {
        Object.assign(item, MAP[item.id]);
        applied.add(item.id);
        updated++;
      }
      // recurse into nested arrays
      for (const k of Object.keys(item)) {
        if (Array.isArray(item[k])) walk(item[k]);
      }
    }
  }
};

walk(att.children);

// find missing IDs
for (const id of Object.keys(MAP)) {
  if (!applied.has(id)) missing.push(id);
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + '\n');

console.log(`עודכנו: ${updated} פריטים`);
console.log(`חסרים: ${missing.length}${missing.length ? ' → ' + missing.join(', ') : ''}`);
