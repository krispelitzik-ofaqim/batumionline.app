import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function fetchContent() {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/content?${bust()}`, { headers: noCacheHeaders, cache: 'no-store' as any });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    saveCache(CACHE_CONTENT, json.data);
    return json.data;
  } catch (err) {
    const cached = await loadCache<any>(CACHE_CONTENT);
    if (cached) return cached;
    throw err;
  }
}

export async function getCachedContent() {
  return loadCache<any>(CACHE_CONTENT);
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
