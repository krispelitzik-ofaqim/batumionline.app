import { Platform } from 'react-native';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE = Platform.OS === 'web'
  ? (typeof window !== 'undefined' && (window.location.port === '8081' || window.location.port === '19006') ? 'http://localhost:3001' : '')
  : __DEV__
    ? `http://${DEV_HOST}:3001`
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

export async function fetchContent() {
  const res = await fetch(`${API_BASE}/api/content`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

export async function fetchRatings() {
  const res = await fetch(`${API_BASE}/api/ratings`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data as Record<string, { sum: number; count: number }>;
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
