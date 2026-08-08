import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONTENT_TR } from './contentTranslations';

// ---- Content localization (server content is Hebrew; translate on read) ----
type ContentLang = 'he' | 'en' | 'fa' | 'ru';
let _contentLang: ContentLang = 'he';
export function setContentLang(l: ContentLang) { _contentLang = l; }

function deepLocalize(v: any, lang: 'en' | 'fa' | 'ru'): any {
  if (typeof v === 'string') {
    const tr = CONTENT_TR[v];
    return tr && tr[lang] ? tr[lang] : v;
  }
  if (Array.isArray(v)) return v.map((x) => deepLocalize(x, lang));
  if (v && typeof v === 'object') {
    const o: any = {};
    for (const k in v) o[k] = deepLocalize(v[k], lang);
    return o;
  }
  return v;
}
// Items to hide from the non-Hebrew (English / Persian) editions — Israel-specific
// content that isn't relevant to English-speaking / Iranian visitors.
const HIDE_NON_HE: Record<string, string[]> = {
  welcome: ['4', '5'],          // "ישראלים בבטומי", "חוזרים הביתה"
  mainCategories: ['3'],        // "סיורים קוליים" (Hebrew audio tours)
  // News banner now shown in all languages (was hidden for non-Hebrew).
  sideBanners: ['realestate'],  // "פורטל הנדל״ן"
  infoPortal: ['culture'],      // "תרבות וכשרות" (Jewish/kosher — Hebrew only)
};

// Audience-specific restaurant sub-groups (category '6'): the Russian group is
// shown only for ru and the Halal group only for fa, each pinned to the TOP of
// the restaurants page; both are hidden for every other language (incl. he/en).
// Returns a shallow-cloned copy so the cached raw content is never mutated.
function applyAudienceGroups(data: any, lang: ContentLang): any {
  if (!data || !Array.isArray(data.mainCategories)) return data;
  const keepTop = lang === 'ru' ? 'r_russian' : lang === 'fa' ? 'r_halal' : null;
  const drop = new Set(['r_russian', 'r_halal'].filter((id) => id !== keepTop));
  // Iranian (fa) edition: also hide the kosher group (Star of David icon).
  if (lang === 'fa') drop.add('r4');
  const mainCategories = data.mainCategories.map((c: any) => {
    if (!c || c.id !== '6' || !Array.isArray(c.children)) return c;
    const kids = c.children.filter((ch: any) => !drop.has(ch.id));
    if (keepTop) {
      const i = kids.findIndex((ch: any) => ch.id === keepTop);
      if (i > 0) { const [g] = kids.splice(i, 1); kids.unshift(g); }
    }
    return { ...c, children: kids };
  });
  return { ...data, mainCategories };
}

export function localizeContent(data: any, lang: ContentLang = _contentLang): any {
  if (!data) return data;
  if (lang === 'he') return applyAudienceGroups(data, 'he');
  const localized = deepLocalize(data, lang);
  if (localized && typeof localized === 'object') {
    for (const key in HIDE_NON_HE) {
      if (Array.isArray(localized[key])) {
        localized[key] = localized[key].filter((it: any) => !(it && HIDE_NON_HE[key].includes(it.id)));
      }
    }
  }
  return applyAudienceGroups(localized, lang);
}

// On a physical device "localhost" is the phone itself, so dev native builds
// can't reach a local backend — always load content from the live server.
export const API_BASE = Platform.OS === 'web'
  ? (typeof window !== 'undefined' && (window.location.port === '8081' || window.location.port === '19006') ? 'http://localhost:3001' : '')
  : 'https://www.batumionline.app';

/**
 * Resolve a stored asset URL to one that works on the current platform.
 * - Absolute URLs (http/https/data:) pass through, except hardcoded localhost which is swapped for API_BASE on native.
 * - Relative paths starting with "/" get API_BASE prefixed (on native).
 * - Anything else (e.g. emoji) is returned as-is.
 */
export function resolveUri(u?: string): string {
  if (!u) return '';
  if (u.startsWith('data:')) return u;
  if (u.startsWith('http://localhost:3001') || u.startsWith('https://localhost:3001')) {
    const path = u.replace(/^https?:\/\/localhost:3001/, '');
    return `${API_BASE}${path}`;
  }
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('/')) return `${API_BASE}${u}`;
  return u;
}

const noCacheHeaders = { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' };
const bust = () => `_t=${Date.now()}`;
const FETCH_TIMEOUT_MS = 10000;
const CACHE_CONTENT = '@cache:content/v1';
const CACHE_RATINGS = '@cache:ratings/v1';

async function fetchWithTimeout(url: string, init?: RequestInit, ms: number = FETCH_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...(init || {}), signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function loadCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
async function saveCache(key: string, value: any) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export async function fetchContent(opts?: { raw?: boolean }) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/content?${bust()}`, { headers: noCacheHeaders, cache: 'no-store' as any });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    saveCache(CACHE_CONTENT, json.data); // cache RAW Hebrew
    return opts?.raw ? json.data : localizeContent(json.data);
  } catch (err) {
    const cached = await loadCache<any>(CACHE_CONTENT);
    if (cached) return opts?.raw ? cached : localizeContent(cached);
    throw err;
  }
}

export async function getCachedContent(opts?: { raw?: boolean }) {
  const cached = await loadCache<any>(CACHE_CONTENT);
  return opts?.raw ? cached : localizeContent(cached);
}
export async function getCachedRatings() {
  return loadCache<Record<string, { sum: number; count: number }>>(CACHE_RATINGS);
}

export async function fetchRatings() {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/ratings?${bust()}`, { headers: noCacheHeaders, cache: 'no-store' as any });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    saveCache(CACHE_RATINGS, json.data);
    return json.data as Record<string, { sum: number; count: number }>;
  } catch (err) {
    const cached = await loadCache<Record<string, { sum: number; count: number }>>(CACHE_RATINGS);
    if (cached) return cached;
    throw err;
  }
}

export async function submitRating(id: string, score: number) {
  const res = await fetch(`${API_BASE}/api/ratings/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as { sum: number; count: number; avg: number };
}

export async function updateSection(section: string, data: any) {
  const res = await fetch(`${API_BASE}/api/content/${section}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

export async function updateAllContent(data: any) {
  const res = await fetch(`${API_BASE}/api/content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

export async function uploadFile(file: { uri: string; name: string; type: string }) {
  const formData = new FormData();
  formData.append('file', file as any);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

// ---- Public classifieds board (marketplace יד2 + real-estate) ----
export async function fetchBoard(board?: 'market' | 'realestate') {
  const url = `${API_BASE}/api/board?${board ? `board=${board}&` : ''}${bust()}`;
  const res = await fetchWithTimeout(url, { headers: noCacheHeaders, cache: 'no-store' as any });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as any[];
}
export async function createAd(rec: any) {
  const res = await fetch(`${API_BASE}/api/board`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec) });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}
export async function updateAd(id: string, rec: any) {
  const res = await fetch(`${API_BASE}/api/board/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec) });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}
export async function deleteAd(id: string, phone: string) {
  const res = await fetch(`${API_BASE}/api/board/${id}?phone=${encodeURIComponent(phone)}`, { method: 'DELETE' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return true;
}
export async function payAd(adId: string): Promise<{ success: boolean; mode: 'auto' | 'manual'; url: string; orderId?: string }> {
  const res = await fetch(`${API_BASE}/api/board/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adId }) });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}
// Upload a local file URI and return a device-independent relative path (/uploads/..).
// Web needs a real Blob in the FormData; native accepts the { uri, name, type } shape.
export async function uploadLocalUri(uri: string, kind: 'image' | 'video' = 'image'): Promise<string> {
  if (!uri || uri.startsWith('http') || uri.startsWith('/uploads')) return uri;
  try {
    const ext = kind === 'video' ? 'mp4' : 'jpg';
    const name = `ad_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`;
    const type = kind === 'video' ? 'video/mp4' : 'image/jpeg';
    const fd = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      fd.append('file', blob, name);
    } else {
      fd.append('file', { uri, name, type } as any);
    }
    const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
    const j: any = await res.json();
    if (!j.success) throw new Error(j.error);
    return j.filename ? `/uploads/${j.filename}` : (j.url || uri);
  } catch { return uri; }
}
