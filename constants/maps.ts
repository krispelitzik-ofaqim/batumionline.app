import { Platform, Linking } from 'react-native';

export function openLocation(lat: number, lng: number, label?: string) {
  if (Platform.OS === 'ios') {
    const q = label ? `${encodeURIComponent(label)}@${lat},${lng}` : `${lat},${lng}`;
    Linking.openURL(`http://maps.apple.com/?q=${q}`).catch(() => {});
  } else {
    const q = label ? `${lat},${lng}(${encodeURIComponent(label)})` : `${lat},${lng}`;
    Linking.openURL(`https://maps.google.com/maps?q=${q}`).catch(() => {});
  }
}

export function openDirections(lat: number, lng: number, label?: string) {
  if (Platform.OS === 'ios') {
    const q = label ? `${encodeURIComponent(label)}@${lat},${lng}` : `${lat},${lng}`;
    Linking.openURL(`http://maps.apple.com/?daddr=${q}`).catch(() => {});
  } else {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(() => {});
  }
}

function extractCoords(url: string): { lat: number; lng: number } | null {
  const patterns = [
    /destination=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /query=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /maps\?q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  return null;
}

export function openMapUrl(url: string, label?: string) {
  if (!url) return;
  if (Platform.OS !== 'ios') { Linking.openURL(url).catch(() => {}); return; }
  const coords = extractCoords(url);
  if (!coords) { Linking.openURL(url).catch(() => {}); return; }
  if (url.includes('/dir') || url.includes('daddr')) openDirections(coords.lat, coords.lng, label);
  else openLocation(coords.lat, coords.lng, label);
}
