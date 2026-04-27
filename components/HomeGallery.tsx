import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { resolveUri, fetchContent } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HOME_IMAGES } from '../assets/images/home';

type GalleryItem = { key: string; source: any; url?: string };

const LOCAL_FALLBACK: GalleryItem[] = HOME_IMAGES.map(h => ({ key: h.key, source: h.source }));

const isBadUrl = (u: any): boolean => {
  if (typeof u !== 'string') return true;
  if (u.trim().length === 0) return true;
  if (u.includes('localhost')) return true;
  if (u.includes('127.0.0.1')) return true;
  return false;
};

export default function HomeGallery({ field = 'homeBanner' }: { field?: string } = {}) {
  const { width } = useWindowDimensions();
  const [files, setFiles] = useState<GalleryItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [errorKeys, setErrorKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(`@${field}`).then(cached => {
      if (!cached) return;
      try {
        const arr = JSON.parse(cached);
        if (!Array.isArray(arr)) return;
        const valid = arr.filter((u: any) => !isBadUrl(u));
        if (valid.length > 0) {
          setFiles(valid.map((u: string, i: number) => ({ key: `hb${i}`, source: { uri: resolveUri(u) }, url: u })));
        } else {
          AsyncStorage.removeItem(`@${field}`).catch(() => {});
        }
      } catch {}
    });
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 8000);
    fetchContent().then((d: any) => {
      clearTimeout(timeoutId);
      if (Array.isArray(d?.[field])) {
        const valid = d[field].filter((u: any) => !isBadUrl(u));
        if (valid.length > 0) {
          setFiles(valid.map((u: string, i: number) => ({ key: `hb${i}`, source: { uri: resolveUri(u) }, url: u })));
          AsyncStorage.setItem(`@${field}`, JSON.stringify(valid)).catch(() => {});
        } else {
          // API explicitly says empty - clear cache and hide
          setFiles([]);
          AsyncStorage.removeItem(`@${field}`).catch(() => {});
        }
      }
    }).catch(() => {});
    return () => clearTimeout(timeoutId);
  }, []);

  // Static gallery - user navigates with arrows (no auto-rotation)

  if (files.length === 0) return null;
  const visibleFiles = files;
  const safeIdx = idx % visibleFiles.length;
  const current = visibleFiles[safeIdx];
  const isErrored = errorKeys.has(current.key);
  const fallbackSource = LOCAL_FALLBACK[safeIdx % LOCAL_FALLBACK.length]?.source;

  const goNext = () => setIdx(i => (i + 1) % visibleFiles.length);
  const goPrev = () => setIdx(i => (i - 1 + visibleFiles.length) % visibleFiles.length);

  return (
    <View style={[styles.wrap, { width: width - 32 }]}>
      <Image
        source={isErrored ? fallbackSource : current.source}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        onError={() => {
          setErrorKeys(prev => {
            const next = new Set(prev);
            next.add(current.key);
            return next;
          });
        }}
      />
      {visibleFiles.length > 1 && (
        <>
          <TouchableOpacity onPress={goPrev} style={[styles.arrow, { right: 8 }]} activeOpacity={0.7}>
            <Text style={styles.arrowTxt}>››</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goNext} style={[styles.arrow, { left: 8 }]} activeOpacity={0.7}>
            <Text style={styles.arrowTxt}>‹‹</Text>
          </TouchableOpacity>
          <View style={styles.dots}>
            {visibleFiles.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setIdx(i)}>
                <View style={[styles.dot, i === safeIdx && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 180, borderRadius: 18, overflow: 'hidden',
    alignSelf: 'center', marginBottom: 18, backgroundColor: '#eee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 5,
  },
  dots: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 18 },
  arrow: { position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  arrowTxt: { fontSize: 30, color: '#fff', fontWeight: '300', lineHeight: 32, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
